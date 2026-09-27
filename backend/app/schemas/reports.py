from pydantic import BaseModel, Field


class ReportGenerate(BaseModel):
    report_type: str = Field(pattern="weekly|monthly")


class SuccessResponse(BaseModel):
    success: bool = True
