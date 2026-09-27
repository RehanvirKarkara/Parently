from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user_or_parent, get_family_parent_ids
from app.models import Medicine, Parent, User
from app.schemas import MedicineCreate, MedicineOut, MedicineUpdate, SuccessResponse

router = APIRouter(prefix="/medicines", tags=["medicines"])

MED_CREATED = "You've added a new medication. We'll send reminders based on its schedule."
MED_UPDATED = "A medicine was updated."
MED_REMOVED = "A medicine was discontinued."


@router.get("", response_model=list[MedicineOut])
def list_medicines(
    parent_id: str | None = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=500, ge=1, le=1000),
    principal: User | Parent = Depends(get_current_user_or_parent),
    db: Session = Depends(get_db),
):
    q = db.query(Medicine)
    if parent_id:
        q = q.filter(Medicine.parent_id == parent_id)
    else:
        q = q.filter(Medicine.parent_id.in_(get_family_parent_ids(db, principal)))
    return q.filter(Medicine.is_active.is_(True)).order_by(Medicine.name).offset(skip).limit(limit).all()


@router.get("/{parent_id}", response_model=list[MedicineOut])
def get_parent_medicines(
    parent_id: str,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=500, ge=1, le=1000),
    principal: User | Parent = Depends(get_current_user_or_parent),
    db: Session = Depends(get_db),
):
    if parent_id not in get_family_parent_ids(db, principal):
        raise HTTPException(status_code=404, detail="Parent not found")
    return (
        db.query(Medicine)
        .filter(Medicine.parent_id == parent_id, Medicine.is_active.is_(True))
        .order_by(Medicine.name)
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.post("", response_model=MedicineOut)
def create_medicine(
    payload: MedicineCreate,
    principal: User | Parent = Depends(get_current_user_or_parent),
    db: Session = Depends(get_db),
):
    if payload.parent_id not in get_family_parent_ids(db, principal):
        raise HTTPException(status_code=404, detail="Parent not found")
    med = Medicine(
        parent_id=payload.parent_id,
        name=payload.name,
        dosage=payload.dosage,
        frequency=payload.frequency,
        instructions=payload.instructions,
        time=payload.time,
        color=payload.color,
    )
    db.add(med)
    db.commit()
    db.refresh(med)

    # Event notification: child added a medicine for the parent -> notify parent + children
    from app.services import notification as notif_service
    parent = db.get(Parent, payload.parent_id)
    is_child_act = isinstance(principal, User)
    notif_service.push_parent(
        db, parent, type="medicine_added", message=MED_CREATED, title=f"New medicine: {med.name}",
        category="medication",
        dedup_key=f"med_added:{med.id}",
    )
    if is_child_act:
        notif_service.notify_all_children(
            db, parent.family_id, type="medicine_added",
            message=f"A new medicine ({med.name}) was added.",
            category="medication", dedup_key=f"med_added_family:{med.id}",
        )
    return med


@router.patch("/{medicine_id}", response_model=MedicineOut)
def update_medicine(
    medicine_id: str,
    payload: MedicineUpdate,
    principal: User | Parent = Depends(get_current_user_or_parent),
    db: Session = Depends(get_db),
):
    med = db.get(Medicine, medicine_id)
    if med is None or med.parent_id not in get_family_parent_ids(db, principal):
        raise HTTPException(status_code=404, detail="Medicine not found")
    changed_name = payload.name is not None
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(med, key, value)
    db.commit()
    db.refresh(med)

    from app.services import notification as notif_service
    parent = db.get(Parent, med.parent_id)
    title = "Medicine updated"
    message = MED_UPDATED + (f" (name changed to {med.name}.)" if changed_name else "")
    notif_service.push_parent(
        db, parent, type="medicine_updated", message=message, title=title, category="medication",
        dedup_key=f"med_updated:{med.id}",
    )
    return med


@router.delete("/{medicine_id}", response_model=SuccessResponse)
def delete_medicine(
    medicine_id: str,
    principal: User | Parent = Depends(get_current_user_or_parent),
    db: Session = Depends(get_db),
):
    med = db.get(Medicine, medicine_id)
    if med is None or med.parent_id not in get_family_parent_ids(db, principal):
        raise HTTPException(status_code=404, detail="Medicine not found")
    med.is_active = False
    db.commit()

    from app.services import notification as notif_service
    parent = db.get(Parent, med.parent_id)
    notif_service.push_parent(
        db, parent, type="medicine_removed", message=MED_REMOVED, title=f"Stopped: {med.name}",
        category="medication", dedup_key=f"med_removed:{med.id}:{med.updated_at.isoformat()}",
    )
    return SuccessResponse(success=True)

