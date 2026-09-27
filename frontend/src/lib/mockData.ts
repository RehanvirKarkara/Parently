import {
  daysAgoISO,
  mulberry32,
  todayISO,
} from "@/lib/utils";
import type {
  AIConversation,
  AppNotification,
  ChatMessage,
  Family,
  FamilyMember,
  HealthLog,
  LegacyAnswer,
  LegacyQuestion,
  Medicine,
  Parent,
  QuizAnswer,
  QuizQuestion,
  Report,
  SiblingInvite,
  User,
} from "@/types";

const now = new Date().toISOString();
const today = todayISO();

const seed = 20260805;
const rand = mulberry32(seed);

function randBetween(min: number, max: number): number {
  return min + rand() * (max - min);
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

export const currentUser: User = {
  id: "u-1",
  email: "alex@parently.app",
  first_name: "Alex",
  last_name: "Morgan",
  is_active: true,
  is_verified: true,
  created_at: daysAgoISO(90),
  updated_at: now,
  phone: "+1 (555) 010-2211",
  avatar_color: "brand",
};

export const siblings: User[] = [
  {
    id: "u-2",
    email: "jamie@parently.app",
    first_name: "Jamie",
    last_name: "Morgan",
    is_active: true,
    is_verified: true,
    created_at: daysAgoISO(40),
    updated_at: now,
    phone: "+1 (555) 010-3344",
    avatar_color: "mint",
  },
  {
    id: "u-3",
    email: "riley@parently.app",
    first_name: "Riley",
    last_name: "Morgan",
    is_active: true,
    is_verified: true,
    created_at: daysAgoISO(12),
    updated_at: now,
    phone: "+1 (555) 010-5566",
    avatar_color: "coral",
  },
];

export const family: Family = {
  id: "fam-1",
  name: "Morgan Family",
  created_by_user_id: "u-1",
  created_at: daysAgoISO(84),
  updated_at: now,
};

export const familyMembers: FamilyMember[] = [
  { id: "fm-1", family_id: "fam-1", user_id: "u-1", role: "creator", joined_at: daysAgoISO(84), is_active: true },
  { id: "fm-2", family_id: "fam-1", user_id: "u-2", role: "sibling", joined_at: daysAgoISO(40), is_active: true },
  { id: "fm-3", family_id: "fam-1", user_id: "u-3", role: "sibling", joined_at: daysAgoISO(12), is_active: true },
];

export const parents: Parent[] = [
  {
    id: "p-mom",
    family_id: "fam-1",
    first_name: "Carol",
    last_name: "Morgan",
    email: "carol@parently.app",
    medical_conditions:
      "Type 2 Diabetes\nHypertension\nMild osteoarthritis in right knee",
    allergies: "Penicillin\nShellfish",
    date_of_birth: "1956-03-12",
    is_active: true,
    created_at: daysAgoISO(84),
    updated_at: now,
    phone: "+1 (555) 010-7788",
    address: "48 Maple Grove, Portland, OR",
    blood_group: "O+",
    avatar_color: "coral",
    goals: ["Walk 5,000 steps daily", "Keep blood sugar stable", "Take all medicines on time"],
  },
  {
    id: "p-dad",
    family_id: "fam-1",
    first_name: "Robert",
    last_name: "Morgan",
    email: "robert@parently.app",
    medical_conditions: "Hypertension\nHigh cholesterol\nGERD",
    allergies: "Sulfa drugs",
    date_of_birth: "1953-09-27",
    is_active: true,
    created_at: daysAgoISO(80),
    updated_at: now,
    phone: "+1 (555) 010-9900",
    address: "48 Maple Grove, Portland, OR",
    blood_group: "A+",
    avatar_color: "brand",
    goals: ["Evening walk after dinner", "Reduce late-night snacking", "Stay hydrated"],
  },
];

const breakfasts = [
  "Oatmeal with banana and a spoon of peanut butter. 1 cup tea, no sugar.",
  "Two boiled eggs, whole wheat toast, orange juice.",
  "Idli with sambar and coconut chutney. Green tea.",
  "Muesli with milk and sliced strawberries.",
  "Paratha with curd and a glass of milk.",
  "Steel-cut oats with cinnamon and apple. Black coffee.",
];
const lunches = [
  "Grilled fish with rice and sautéed spinach. Salad with olive oil.",
  "Lentil soup with a small whole-grain roll and cucumber salad.",
  "Chicken stir-fry with brown rice and broccoli.",
  "Vegetable biryani with raita. One chapati.",
  "Quinoa bowl with chickpeas, roasted peppers, and tahini dressing.",
  "Tofu curry with rice and green beans.",
];
const dinners = [
  "Roast chicken with mashed potatoes and green beans. Herbal tea.",
  "Vegetable soup and a grilled cheese sandwich.",
  "Fish curry with rice and a side of carrots.",
  "Minestrone with whole grain bread. Fruit for dessert.",
  "Baked salmon, quinoa, and asparagus.",
  "Stuffed peppers with salad and yogurt.",
];
const workouts = [
  "Light yoga for 20 minutes",
  "30 min brisk walk around the park",
  "Strength bands: 2 sets x 10 reps",
  "Gentle cycling for 25 minutes",
  "Stretching and balance exercises",
  "No formal workout today",
];

function makeLogs(parentId: string, baseline: { sleep: number; steps: number; rating: number }): HealthLog[] {
  const logs: HealthLog[] = [];
  for (let day = 13; day >= 0; day--) {
    const date = daysAgoISO(day);
    const hasTodayMorning = day === 0;
    const sleepVariance = randBetween(-0.8, 0.9);
    const morning = rand() > 0.08;
    const afternoon = rand() > 0.1;
    const evening = rand() > 0.08;

    const slots: HealthLog[] = [
      {
        id: `log-${parentId}-${date}-m`,
        parent_id: parentId,
        log_date: date,
        log_time_of_day: "morning" as const,
        hours_slept: Math.round((baseline.sleep + sleepVariance) * 10) / 10,
        meds_taken: rand() > 0.06,
        breakfast_details: pick(breakfasts),
        lunch_details: null,
        steps_walked_afternoon: null,
        workout_details: null,
        snacks_dinner_details: null,
        steps_walked_evening: null,
        day_rating: null,
        created_at: `${date}T08:15:00.000Z`,
        updated_at: `${date}T08:15:00.000Z`,
      },
      {
        id: `log-${parentId}-${date}-a`,
        parent_id: parentId,
        log_date: date,
        log_time_of_day: "afternoon" as const,
        hours_slept: null,
        meds_taken: null,
        breakfast_details: null,
        lunch_details: pick(lunches),
        steps_walked_afternoon: Math.round(baseline.steps * randBetween(0.7, 1.4)),
        workout_details: pick(workouts),
        snacks_dinner_details: null,
        steps_walked_evening: null,
        day_rating: null,
        created_at: `${date}T14:20:00.000Z`,
        updated_at: `${date}T14:20:00.000Z`,
      },
      {
        id: `log-${parentId}-${date}-e`,
        parent_id: parentId,
        log_date: date,
        log_time_of_day: "evening" as const,
        hours_slept: null,
        meds_taken: null,
        breakfast_details: null,
        lunch_details: null,
        steps_walked_afternoon: null,
        workout_details: null,
        snacks_dinner_details: pick(dinners),
        steps_walked_evening: Math.round(baseline.steps * randBetween(0.3, 0.8)),
        day_rating: Math.round(randBetween(baseline.rating - 1.5, baseline.rating + 1.5)),
        created_at: `${date}T19:40:00.000Z`,
        updated_at: `${date}T19:40:00.000Z`,
      },
    ];

    if (hasTodayMorning) {
      // Today: mom did morning, missed afternoon. Dad missed morning AND afternoon.
      if (parentId === "p-mom") {
        slots[0] = { ...slots[0], breakfast_details: pick(breakfasts) };
        slots[1] = { ...slots[1], log_time_of_day: "afternoon", lunch_details: null, steps_walked_afternoon: null, workout_details: null };
        slots[2] = { ...slots[2], log_time_of_day: "evening", snacks_dinner_details: null, steps_walked_evening: null, day_rating: null };
      } else {
        slots[0] = { ...slots[0], log_time_of_day: "morning", hours_slept: null, meds_taken: null, breakfast_details: null };
        slots[1] = { ...slots[1], log_time_of_day: "afternoon", lunch_details: null, steps_walked_afternoon: null, workout_details: null };
        slots[2] = { ...slots[2], log_time_of_day: "evening", snacks_dinner_details: null, steps_walked_evening: null, day_rating: null };
      }
      const todayLogs = slots.filter((s) => s.log_time_of_day !== "morning" || hasTodayMorning);
      logs.push(...todayLogs);
      continue;
    }

    const statuses = [morning, afternoon, evening];
    slots.forEach((slot, i) => {
      if (statuses[i]) logs.push(slot);
    });
  }
  return logs.filter(Boolean) as HealthLog[];
}

export const healthLogs: HealthLog[] = [
  ...makeLogs("p-mom", { sleep: 6.8, steps: 4200, rating: 7 }),
  ...makeLogs("p-dad", { sleep: 6.4, steps: 3600, rating: 7 }),
];

export const medicines: Medicine[] = [
  {
    id: "med-1",
    parent_id: "p-mom",
    name: "Metformin",
    dosage: "500 mg",
    frequency: "Twice daily with meals",
    instructions: "Take with breakfast and dinner to reduce stomach upset.",
    start_date: daysAgoISO(200),
    end_date: null,
    is_active: true,
    created_at: daysAgoISO(84),
    updated_at: now,
    time: "08:00",
    color: "brand",
  },
  {
    id: "med-2",
    parent_id: "p-mom",
    name: "Amlodipine",
    dosage: "5 mg",
    frequency: "Once daily",
    instructions: "Take in the morning. Report any ankle swelling.",
    start_date: daysAgoISO(150),
    end_date: null,
    is_active: true,
    created_at: daysAgoISO(84),
    updated_at: now,
    time: "08:30",
    color: "coral",
  },
  {
    id: "med-3",
    parent_id: "p-mom",
    name: "Vitamin D3",
    dosage: "1000 IU",
    frequency: "Once daily",
    instructions: "Take with a meal containing fat for better absorption.",
    start_date: daysAgoISO(300),
    end_date: null,
    is_active: true,
    created_at: daysAgoISO(84),
    updated_at: now,
    time: "12:00",
    color: "mint",
  },
  {
    id: "med-4",
    parent_id: "p-mom",
    name: "Aspirin",
    dosage: "75 mg",
    frequency: "Once daily",
    instructions: "Evening, after dinner.",
    start_date: daysAgoISO(120),
    end_date: null,
    is_active: true,
    created_at: daysAgoISO(84),
    updated_at: now,
    time: "20:00",
    color: "warning",
  },
  {
    id: "med-5",
    parent_id: "p-dad",
    name: "Atorvastatin",
    dosage: "20 mg",
    frequency: "Once daily at night",
    instructions: "Take at bedtime.",
    start_date: daysAgoISO(180),
    end_date: null,
    is_active: true,
    created_at: daysAgoISO(80),
    updated_at: now,
    time: "22:00",
    color: "brand",
  },
  {
    id: "med-6",
    parent_id: "p-dad",
    name: "Telmisartan",
    dosage: "40 mg",
    frequency: "Once daily",
    instructions: "Morning, with or without food.",
    start_date: daysAgoISO(90),
    end_date: null,
    is_active: true,
    created_at: daysAgoISO(80),
    updated_at: now,
    time: "08:00",
    color: "coral",
  },
  {
    id: "med-7",
    parent_id: "p-dad",
    name: "Omeprazole",
    dosage: "20 mg",
    frequency: "Once daily",
    instructions: "Take 30 minutes before breakfast.",
    start_date: daysAgoISO(60),
    end_date: daysAgoISO(-7),
    is_active: true,
    created_at: daysAgoISO(80),
    updated_at: now,
    time: "07:30",
    color: "mint",
  },
];

export const reports: Report[] = [
  {
    id: "rep-1",
    family_id: "fam-1",
    report_type: "weekly",
    report_period_start: daysAgoISO(7),
    report_period_end: today,
    content: "Weekly report for the Morgan family. Carol maintained strong medicine adherence (96%) with sleep averaging 6.8 hours. Robert's steps dipped slightly mid-week but recovered by the weekend. Both parents completed all check-ins on 5 of 7 days.",
    generated_at: `${today}T07:00:00.000Z`,
  },
  {
    id: "rep-2",
    family_id: "fam-1",
    report_type: "monthly",
    report_period_start: daysAgoISO(30),
    report_period_end: today,
    content: "Monthly summary: Overall health scores improved 4% this month. Carol's average day rating rose from 6.7 to 7.3. Robert reported consistent sleep improvement with fewer late-night snacks. Medicine adherence stayed above 94% for both parents.",
    generated_at: `${daysAgoISO(1)}T07:00:00.000Z`,
  },
  {
    id: "rep-3",
    family_id: "fam-1",
    report_type: "weekly",
    report_period_start: daysAgoISO(14),
    report_period_end: daysAgoISO(7),
    content: "Both parents completed all daily check-ins this week. Carol's knee pain reported twice in morning logs — suggest gentle exercises. Robert's evening steps averaged 2,100.",
    generated_at: `${daysAgoISO(7)}T07:00:00.000Z`,
  },
];

export const quizQuestions: QuizQuestion[] = [
  {
    id: "qq-1",
    question_text: "What was Mom's favorite childhood activity?",
    category: "childhood",
    options: ["Swimming at the lake", "Baking with grandma", "Cycling to the library", "Board games with cousins"],
  },
  {
    id: "qq-2",
    question_text: "Which song did Dad always sing in the car?",
    category: "general",
    options: ["American Pie", "Sweet Caroline", "Hotel California", "Country Roads"],
  },
  {
    id: "qq-3",
    question_text: "Where did Mom and Dad go on their first date?",
    category: "general",
    options: ["The drive-in theater", "A riverside café", "The state fair", "A jazz bar downtown"],
  },
  {
    id: "qq-4",
    question_text: "What was Dad's first job?",
    category: "childhood",
    options: ["Newspaper delivery", "Bike shop mechanic", "Grocery bagger", "Lawn mowing"],
  },
  {
    id: "qq-5",
    question_text: "What's the family's most repeated dinner story?",
    category: "general",
    options: ["The burnt Thanksgiving turkey", "The runaway roast", "The exploding pressure cooker", "The birthday cake disaster"],
  },
];

export const quizAnswers: QuizAnswer[] = [
  { id: "qa-1", quiz_question_id: "qq-1", family_member_id: "fm-1", answer_text: "Cycling to the library", answered_at: daysAgoISO(6) },
  { id: "qa-2", quiz_question_id: "qq-2", family_member_id: "fm-2", answer_text: "Sweet Caroline", answered_at: daysAgoISO(6) },
  { id: "qa-3", quiz_question_id: "qq-3", family_member_id: "fm-3", answer_text: "The drive-in theater", answered_at: daysAgoISO(6) },
  { id: "qa-4", quiz_question_id: "qq-1", family_member_id: "fm-2", answer_text: "Baking with grandma", answered_at: daysAgoISO(3) },
  { id: "qa-5", quiz_question_id: "qq-4", family_member_id: "fm-1", answer_text: "Newspaper delivery", answered_at: daysAgoISO(3) },
  { id: "qa-6", quiz_question_id: "qq-5", family_member_id: "fm-3", answer_text: "The burnt Thanksgiving turkey", answered_at: daysAgoISO(1) },
];

export const legacyQuestions: LegacyQuestion[] = [
  {
    id: "lq-1",
    question_text: "What is a small daily habit that has brought you the most joy?",
    created_at: today,
  },
  {
    id: "lq-2",
    question_text: "What was the best piece of advice your parents ever gave you?",
    created_at: daysAgoISO(1),
  },
  {
    id: "lq-3",
    question_text: "What's a meal you'll never forget, and who made it?",
    created_at: daysAgoISO(2),
  },
  {
    id: "lq-4",
    question_text: "What do you wish you had known in your twenties?",
    created_at: daysAgoISO(3),
  },
];

export const legacyAnswers: LegacyAnswer[] = [
  {
    id: "la-1",
    legacy_question_id: "lq-4",
    parent_id: "p-mom",
    answer_text:
      "I wish I'd known that it's okay to ask for help. I spent years trying to do everything perfectly and on my own. Asking for help isn't a weakness — it's how things get done well, and it brings people closer.",
    answered_at: daysAgoISO(3),
  },
  {
    id: "la-2",
    legacy_question_id: "lq-3",
    parent_id: "p-dad",
    answer_text:
      "Your mother's lasagna from the old family recipe, the one she learned from Nonna. She'd make it every Christmas Eve and the whole house would smell like garlic and basil for two days.",
    answered_at: daysAgoISO(2),
  },
  {
    id: "la-3",
    legacy_question_id: "lq-2",
    parent_id: "p-mom",
    answer_text:
      "My dad always said, 'Do the right thing when no one is watching.' It sounds simple but it guided every big decision I made. Honesty compounds over a lifetime.",
    answered_at: daysAgoISO(1),
  },
];

export const notifications: AppNotification[] = [
  {
    id: "n-1",
    recipient_user_id: "u-1",
    recipient_parent_id: null,
    type: "missed_checkin_child",
    message: "Dad missed his morning and afternoon check-ins today. Please reach out to check on him.",
    is_read: false,
    sent_at: `${today}T15:10:00.000Z`,
    related_log_id: null,
    title: "Dad has missed 2 check-ins",
  },
  {
    id: "n-2",
    recipient_user_id: null,
    recipient_parent_id: "p-mom",
    type: "missed_checkin_parent",
    message: "You missed your afternoon check-in. A quick update takes less than a minute — how are you feeling?",
    is_read: false,
    sent_at: `${today}T14:05:00.000Z`,
    related_log_id: null,
    title: "A friendly reminder",
  },
  {
    id: "n-3",
    recipient_user_id: "u-1",
    recipient_parent_id: null,
    type: "report_ready",
    message: "Your weekly family health report is ready to view.",
    is_read: false,
    sent_at: `${today}T07:00:00.000Z`,
    related_log_id: null,
    title: "Weekly report ready",
  },
  {
    id: "n-4",
    recipient_user_id: null,
    recipient_parent_id: "p-mom",
    type: "medicine_reminder",
    message: "Time to take Metformin and Amlodipine with breakfast.",
    is_read: false,
    sent_at: `${today}T08:00:00.000Z`,
    related_log_id: null,
    title: "Medicine reminder",
  },
  {
    id: "n-5",
    recipient_user_id: null,
    recipient_parent_id: "p-dad",
    type: "medicine_reminder",
    message: "Time to take Telmisartan.",
    is_read: true,
    sent_at: `${today}T08:00:00.000Z`,
    related_log_id: null,
    title: "Medicine reminder",
  },
  {
    id: "n-6",
    recipient_user_id: "u-1",
    recipient_parent_id: null,
    type: "legacy_shared",
    message: "Mom shared a new legacy answer: \"The best advice my dad gave me…\"",
    is_read: true,
    sent_at: daysAgoISO(1),
    related_log_id: null,
    title: "Mom shared a memory",
  },
  {
    id: "n-7",
    recipient_user_id: "u-2",
    recipient_parent_id: null,
    type: "family_activity",
    message: "Riley joined the family circle.",
    is_read: true,
    sent_at: daysAgoISO(12),
    related_log_id: null,
    title: "Welcome, Riley",
  },
  {
    id: "n-8",
    recipient_user_id: "u-1",
    recipient_parent_id: null,
    type: "quiz_invite",
    message: "Mom answered a new Family Bonding Quiz question.",
    is_read: true,
    sent_at: daysAgoISO(6),
    related_log_id: null,
    title: "New quiz answer",
  },
];

export const siblingInvites: SiblingInvite[] = [
  { email: "sam@parently.app", status: "pending", invited_at: daysAgoISO(2) },
  { email: "erin@parently.app", status: "accepted", invited_at: daysAgoISO(20) },
];

/* ---------- AI conversations ---------- */

export const offspringConversation: AIConversation = {
  id: "conv-1",
  user_id: "u-1",
  parent_id: null,
  conversation_type: "offspring_chatbot",
  started_at: daysAgoISO(3),
  updated_at: now,
  message_history: [
    {
      id: "cm-1",
      role: "user",
      content: "Why did Mom's energy feel off today?",
      timestamp: daysAgoISO(3),
    },
    {
      id: "cm-2",
      role: "assistant",
      content:
        "Looking at Carol's data over the past week, she slept only **5.9 hours** the night before — about 0.9 hours below her baseline of 6.8. She also skipped her afternoon walk, so her step count dropped from ~4,200 to 1,850.\n\nLow sleep plus reduced activity is the most likely reason her energy felt low. Her medicine adherence stayed perfect, so I don't see a medication-related cause.\n\n**Suggestions:**\n• A gentle call this evening to check in\n• Encourage a 15-minute afternoon walk tomorrow\n• Make sure she's not having caffeine after 3 PM",
      timestamp: daysAgoISO(3),
      insight: { kind: "sleep", title: "Sleep down 0.9h from baseline", value: "5.9h" },
    },
    {
      id: "cm-3",
      role: "user",
      content: "Should I be worried?",
      timestamp: daysAgoISO(3),
    },
    {
      id: "cm-4",
      role: "assistant",
      content:
        "No cause for alarm. A single low-energy day with a short night of sleep is common and usually self-corrects. Her vitals-related indicators — rating, medicines, and eating — were all normal.\n\nI'll flag it if this pattern continues for **3+ consecutive days**, or if her sleep stays under 6 hours. You'll get a notification if that happens.",
      timestamp: daysAgoISO(3),
    },
  ],
};

export const parentConversation: AIConversation = {
  id: "conv-2",
  user_id: null,
  parent_id: "p-mom",
  conversation_type: "parent_chatbot",
  started_at: daysAgoISO(5),
  updated_at: now,
  message_history: [
    {
      id: "cm-5",
      role: "user",
      content: "Why am I having trouble sleeping lately?",
      timestamp: daysAgoISO(5),
    },
    {
      id: "cm-6",
      role: "assistant",
      content:
        "Looking at your last week of check-ins, your sleep has averaged **6.2 hours**, down from 6.8. A few patterns stand out:\n\n• You've had tea late in the evening on 3 of the last 4 days\n• Your evening walks dropped from ~2,000 to ~1,000 steps\n• You rated two days a 6 — slightly lower than your usual 7\n\n**A few gentle ideas:**\n• Try herbal tea after 6 PM instead of regular tea\n• A 15-minute walk after dinner can help you wind down\n• Keep the bedroom cool and dark\n\nWould you like me to track these for the next week and see if sleep improves?",
      timestamp: daysAgoISO(5),
      insight: { kind: "sleep", title: "Sleep averaging 6.2h this week", value: "6.2h" },
    },
  ],
};

export function makeAssistantMessage(role: "user" | "assistant", content: string, insight?: ChatMessage["insight"]): ChatMessage {
  return { id: `cm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, role, content, timestamp: new Date().toISOString(), insight: insight ?? null };
}
