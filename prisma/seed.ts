import { PrismaClient, UserRole, EmployeeStatus, EmploymentType, AttendanceStatus, LeaveType, LeaveStatus, PayrollStatus, CycleType, CycleStatus, ReviewStatus, ReviewerType, GoalType, GoalStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("Password123!", 10);

  // ---- Super admin (global, no tenant) ----
  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@attendance.app" },
    update: {},
    create: {
      email: "superadmin@attendance.app",
      passwordHash: password,
      name: "Super Admin",
      role: UserRole.SUPER_ADMIN,
    },
  });

  // ---- Tenant 1: Gulf Tech LLC ----
  const tenant1 = await prisma.tenant.upsert({
    where: { slug: "gulf-tech" },
    update: {},
    create: {
      name: "Gulf Tech LLC",
      slug: "gulf-tech",
      country: "United Arab Emirates",
      currency: "AED",
      timezone: "Asia/Dubai",
      plan: "premium",
    },
  });

  // ---- Tenant 2: Riyadh Solutions ----
  const tenant2 = await prisma.tenant.upsert({
    where: { slug: "riyadh-solutions" },
    update: {},
    create: {
      name: "Riyadh Solutions",
      slug: "riyadh-solutions",
      country: "Saudi Arabia",
      currency: "SAR",
      timezone: "Asia/Riyadh",
      plan: "standard",
    },
  });

  // ---- Departments for tenant 1 ----
  const engineering = await prisma.department.create({
    data: { tenantId: tenant1.id, name: "Engineering", code: "ENG" },
  });
  const hrDept = await prisma.department.create({
    data: { tenantId: tenant1.id, name: "Human Resources", code: "HR" },
  });
  const finance = await prisma.department.create({
    data: { tenantId: tenant1.id, name: "Finance", code: "FIN" },
  });

  // ---- Users for tenant 1 ----
  const adminUser = await prisma.user.create({
    data: { tenantId: tenant1.id, email: "admin@gulftech.com", passwordHash: password, name: "Ahmed Al Mansoori", role: UserRole.ADMIN, phone: "+971501234567" },
  });
  const managerUser = await prisma.user.create({
    data: { tenantId: tenant1.id, email: "manager@gulftech.com", passwordHash: password, name: "Sara Mohammed", role: UserRole.MANAGER, phone: "+971502345678" },
  });
  const staffUser = await prisma.user.create({
    data: { tenantId: tenant1.id, email: "staff@gulftech.com", passwordHash: password, name: "Omar Khalid", role: UserRole.STAFF, phone: "+971503456789" },
  });
  const empUser = await prisma.user.create({
    data: { tenantId: tenant1.id, email: "employee@gulftech.com", passwordHash: password, name: "Fatima Hassan", role: UserRole.EMPLOYEE, phone: "+971504567890" },
  });

  // ---- Employees for tenant 1 ----
  const empAhmed = await prisma.employee.create({
    data: {
      tenantId: tenant1.id, userId: adminUser.id, employeeCode: "GT-001",
      firstName: "Ahmed", lastName: "Al Mansoori", email: "admin@gulftech.com",
      phone: "+971501234567", gender: "male", nationality: "Emirati",
      departmentId: hrDept.id, designation: "HR Director", employmentType: EmploymentType.FULL_TIME,
      status: EmployeeStatus.ACTIVE, joinDate: new Date("2020-01-15"),
      emiratesIdNumber: "784-1985-1234567-1", emiratesIdExpiry: new Date("2028-01-14"),
      passportNumber: "P12345678", passportExpiry: new Date("2029-05-10"),
      visaNumber: "V-2024-0001", visaType: "residence", visaExpiry: new Date("2027-02-20"),
      bankName: "Emirates NBD", bankAccountNumber: "AE1001234567890", bankIban: "AE070331234567890123456",
    },
  });

  const empSara = await prisma.employee.create({
    data: {
      tenantId: tenant1.id, userId: managerUser.id, employeeCode: "GT-002",
      firstName: "Sara", lastName: "Mohammed", email: "manager@gulftech.com",
      phone: "+971502345678", gender: "female", nationality: "Emirati",
      departmentId: engineering.id, designation: "Engineering Manager", employmentType: EmploymentType.FULL_TIME,
      status: EmployeeStatus.ACTIVE, joinDate: new Date("2021-03-01"),
      reportingToId: empAhmed.id,
      emiratesIdNumber: "784-1990-7654321-2", emiratesIdExpiry: new Date("2027-11-30"),
      passportNumber: "P87654321", passportExpiry: new Date("2028-08-15"),
      visaNumber: "V-2024-0002", visaType: "residence", visaExpiry: new Date("2026-12-31"),
    },
  });

  const empOmar = await prisma.employee.create({
    data: {
      tenantId: tenant1.id, userId: staffUser.id, employeeCode: "GT-003",
      firstName: "Omar", lastName: "Khalid", email: "staff@gulftech.com",
      phone: "+971503456789", gender: "male", nationality: "Egyptian",
      departmentId: finance.id, designation: "Payroll Specialist", employmentType: EmploymentType.FULL_TIME,
      status: EmployeeStatus.ACTIVE, joinDate: new Date("2022-06-10"),
      reportingToId: empAhmed.id,
      passportNumber: "P11223344", passportExpiry: new Date("2027-03-22"),
      visaNumber: "V-2024-0003", visaType: "employment", visaExpiry: new Date("2026-09-15"),
      bankName: "ADCB", bankIban: "AE020311234567890123456",
    },
  });

  const empFatima = await prisma.employee.create({
    data: {
      tenantId: tenant1.id, userId: empUser.id, employeeCode: "GT-004",
      firstName: "Fatima", lastName: "Hassan", email: "employee@gulftech.com",
      phone: "+971504567890", gender: "female", nationality: "Jordanian",
      departmentId: engineering.id, designation: "Senior Software Engineer", employmentType: EmploymentType.FULL_TIME,
      status: EmployeeStatus.ACTIVE, joinDate: new Date("2023-02-01"),
      reportingToId: empSara.id,
      emiratesIdNumber: "784-1995-9988776-3", emiratesIdExpiry: new Date("2028-06-18"),
      passportNumber: "P99887766", passportExpiry: new Date("2030-01-05"),
      visaNumber: "V-2024-0004", visaType: "residence", visaExpiry: new Date("2027-04-10"),
      bankName: "FAB", bankIban: "AE030331234567890123456",
    },
  });

  // ---- Set department managers ----
  await prisma.department.update({ where: { id: hrDept.id }, data: { managerId: empAhmed.id } });
  await prisma.department.update({ where: { id: engineering.id }, data: { managerId: empSara.id } });
  await prisma.department.update({ where: { id: finance.id }, data: { managerId: empOmar.id } });

  // ---- Salary structures ----
  const salaryDefs: Array<{ emp: string; basic: number; housing: number; transport: number }> = [
    { emp: empAhmed.id, basic: 25000, housing: 8000, transport: 2000 },
    { emp: empSara.id, basic: 18000, housing: 6000, transport: 1500 },
    { emp: empOmar.id, basic: 12000, housing: 4000, transport: 1000 },
    { emp: empFatima.id, basic: 15000, housing: 5000, transport: 1200 },
  ];
  for (const s of salaryDefs) {
    await prisma.salaryStructure.create({
      data: {
        tenantId: tenant1.id, employeeId: s.emp,
        basicSalary: s.basic, housingAllowance: s.housing, transportAllowance: s.transport,
        foodAllowance: 800, otherAllowance: 0, overtimeRate: 75,
        taxRate: 0, insuranceRate: 1.5,
      },
    });
  }

  // ---- Attendance for the last 5 working days (for Fatima) ----
  const today = new Date();
  for (let i = 1; i <= 5; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (d.getDay() === 0 || d.getDay() === 6) continue; // skip weekend (Fri/Sat in some; here Sun=0)
    const checkIn = new Date(d); checkIn.setHours(9, i % 2 === 0 ? 2 : 15, 0, 0);
    const checkOut = new Date(d); checkOut.setHours(18, 30, 0, 0);
    await prisma.attendance.create({
      data: {
        tenantId: tenant1.id, employeeId: empFatima.id, date: d,
        checkIn, checkOut, status: i % 4 === 0 ? AttendanceStatus.LATE : AttendanceStatus.PRESENT,
        workHours: 9.4, lateMinutes: i % 4 === 0 ? 15 : 0, source: "biometric",
      },
    });
  }

  // ---- Leave requests ----
  await prisma.leaveRequest.create({
    data: {
      tenantId: tenant1.id, employeeId: empFatima.id, type: LeaveType.ANNUAL,
      status: LeaveStatus.PENDING, startDate: new Date(today.getFullYear(), today.getMonth() + 1, 10),
      endDate: new Date(today.getFullYear(), today.getMonth() + 1, 14), totalDays: 5,
      reason: "Family vacation", approverId: managerUser.id,
    },
  });
  await prisma.leaveRequest.create({
    data: {
      tenantId: tenant1.id, employeeId: empSara.id, type: LeaveType.SICK,
      status: LeaveStatus.APPROVED, startDate: new Date(today.getFullYear(), today.getMonth(), 5),
      endDate: new Date(today.getFullYear(), today.getMonth(), 6), totalDays: 2,
      reason: "Flu", approverId: adminUser.id, approverNote: "Get well soon", decidedAt: new Date(),
    },
  });

  // ---- Leave balances ----
  const year = today.getFullYear();
  for (const emp of [empAhmed, empSara, empOmar, empFatima]) {
    await prisma.leaveBalance.createMany({
      data: [
        { tenantId: tenant1.id, employeeId: emp.id, year, type: LeaveType.ANNUAL, entitled: 30, used: emp.id === empSara.id ? 2 : 0 },
        { tenantId: tenant1.id, employeeId: emp.id, year, type: LeaveType.SICK, entitled: 10, used: emp.id === empSara.id ? 2 : 0 },
        { tenantId: tenant1.id, employeeId: emp.id, year, type: LeaveType.CASUAL, entitled: 5, used: 0 },
      ],
    });
  }

  // ---- Holidays ----
  await prisma.holiday.create({ data: { tenantId: tenant1.id, name: "National Day", date: new Date(year, 11, 2), type: "public" } });
  await prisma.holiday.create({ data: { tenantId: tenant1.id, name: "Eid Al Fitr", date: new Date(year, 3, 10), type: "public" } });

  // ---- A draft payroll ----
  const periodStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const periodEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const payroll = await prisma.payroll.create({
    data: {
      tenantId: tenant1.id, name: `${periodStart.toLocaleString("en", { month: "long" })} ${year}`,
      periodStart, periodEnd, status: PayrollStatus.DRAFT,
    },
  });

  for (const s of salaryDefs) {
    const struct = await prisma.salaryStructure.findUnique({ where: { employeeId: s.emp } });
    if (!struct) continue;
    const gross = Number(struct.basicSalary) + Number(struct.housingAllowance) + Number(struct.transportAllowance) + Number(struct.foodAllowance);
    const insurance = gross * Number(struct.insuranceRate) / 100;
    const net = gross - insurance;
    await prisma.payrollItem.create({
      data: {
        payrollId: payroll.id, tenantId: tenant1.id, employeeId: s.emp,
        basicSalary: struct.basicSalary,
        totalAllowances: Number(struct.housingAllowance) + Number(struct.transportAllowance) + Number(struct.foodAllowance),
        insuranceAmount: insurance, grossPay: gross, netPay: net,
        workingDays: 22, presentDays: 22,
      },
    });
  }

  // ---- Performance & Reviews ----
  const competencies = [
    { name: "Job Knowledge", description: "Demonstrates understanding of role and responsibilities" },
    { name: "Quality of Work", description: "Produces accurate, thorough, high-quality output" },
    { name: "Productivity", description: "Completes work efficiently and meets deadlines" },
    { name: "Teamwork", description: "Collaborates effectively with colleagues" },
    { name: "Communication", description: "Communicates clearly and professionally" },
    { name: "Initiative", description: "Takes proactive action and shows ownership" },
  ];

  const cycleYear = today.getFullYear();
  const cycle = await prisma.performanceCycle.create({
    data: {
      tenantId: tenant1.id,
      name: `${cycleYear} Annual Review`,
      type: CycleType.ANNUAL,
      status: CycleStatus.REVIEW_IN_PROGRESS,
      periodStart: new Date(cycleYear, 0, 1),
      periodEnd: new Date(cycleYear, 11, 31),
      selfReviewStart: new Date(cycleYear, 11, 1),
      selfReviewEnd: new Date(cycleYear, 11, 15),
      managerReviewStart: new Date(cycleYear, 11, 16),
      managerReviewEnd: new Date(cycleYear, 11, 28),
      ratingScale: "5",
      competencies: competencies as any,
    },
  });

  // Reviews: Sara (reviewed by Ahmed), Fatima (reviewed by Sara), Omar (reviewed by Ahmed)
  const reviewDefs = [
    { emp: empSara, reviewer: empAhmed, selfDone: true, mgrDone: true, final: 4 },
    { emp: empFatima, reviewer: empSara, selfDone: true, mgrDone: false, final: null },
    { emp: empOmar, reviewer: empAhmed, selfDone: false, mgrDone: false, final: null },
  ];

  for (const r of reviewDefs) {
    const status = r.mgrDone ? ReviewStatus.COMPLETED : r.selfDone ? ReviewStatus.MANAGER_REVIEW_PENDING : ReviewStatus.SELF_REVIEW_PENDING;
    await prisma.performanceReview.create({
      data: {
        tenantId: tenant1.id,
        cycleId: cycle.id,
        employeeId: r.emp.id,
        reviewerId: r.reviewer.id,
        status,
        ...(r.selfDone ? {
          selfRating: r.final ? r.final - 1 : 3,
          selfStrengths: "Delivered key projects on time and mentored junior team members.",
          selfImprovements: "Could improve cross-team communication and delegation.",
          selfAchievements: "Led the migration to the new platform; reduced incident response time by 30%.",
          selfComments: "I feel I've grown significantly this year and taken on more responsibility.",
          selfSubmittedAt: new Date(cycleYear, 11, 10),
        } : {}),
        ...(r.mgrDone ? {
          managerRating: r.final ?? 4,
          managerStrengths: "Consistently delivers high-quality work and demonstrates strong leadership.",
          managerImprovements: "Should focus on strategic planning and developing successors.",
          managerAchievements: "Exceeded all quarterly targets and successfully led the team through a major transition.",
          managerComments: "A key contributor to the team's success. Ready for expanded responsibilities.",
          managerSubmittedAt: new Date(cycleYear, 11, 20),
          competencyScores: competencies.map((c, i) => ({ name: c.name, score: 4 + (i % 2), comment: "" })) as any,
          finalRating: r.final,
          finalComments: r.final ? "Strong performer — recommend for promotion consideration." : null,
          recommendations: r.final && r.final >= 4 ? "Promotion consideration" : null,
          completedAt: new Date(cycleYear, 11, 22),
        } : {}),
      },
    });
  }

  // Goals / KPIs
  const goalDefs = [
    { emp: empFatima, title: "Complete platform migration", type: GoalType.OKR, status: GoalStatus.ACHIEVED, progress: 100, weight: 30, target: "1 platform", actual: "1 platform" },
    { emp: empFatima, title: "Mentor 2 junior engineers", type: GoalType.DEVELOPMENT, status: GoalStatus.ON_TRACK, progress: 75, weight: 20, target: "2 engineers", actual: "1.5 engineers" },
    { emp: empFatima, title: "Reduce incident response time by 25%", type: GoalType.KPI, status: GoalStatus.ACHIEVED, progress: 100, weight: 25, target: "25%", actual: "30%" },
    { emp: empSara, title: "Improve team retention to 90%", type: GoalType.KPI, status: GoalStatus.ON_TRACK, progress: 80, weight: 40, target: "90%", actual: "88%" },
    { emp: empSara, title: "Launch engineering mentorship program", type: GoalType.PERFORMANCE, status: GoalStatus.ACHIEVED, progress: 100, weight: 30, target: "1 program", actual: "1 program" },
    { emp: empOmar, title: "Process payroll with zero errors", type: GoalType.KPI, status: GoalStatus.AT_RISK, progress: 60, weight: 50, target: "0 errors", actual: "2 errors" },
  ];

  for (const g of goalDefs) {
    await prisma.performanceGoal.create({
      data: {
        tenantId: tenant1.id,
        employeeId: g.emp.id,
        cycleId: cycle.id,
        title: g.title,
        type: g.type,
        status: g.status,
        progress: g.progress,
        weight: g.weight,
        targetValue: g.target,
        actualValue: g.actual,
        startDate: new Date(cycleYear, 0, 1),
        dueDate: new Date(cycleYear, 11, 31),
        completedAt: g.status === GoalStatus.ACHIEVED ? new Date(cycleYear, 10, 30) : null,
      },
    });
  }

  // 360 feedback
  await prisma.reviewFeedback.create({
    data: {
      tenantId: tenant1.id, cycleId: cycle.id,
      fromEmployeeId: empOmar.id, toEmployeeId: empFatima.id,
      type: ReviewerType.PEER, rating: 5,
      strengths: "Excellent collaborator and always willing to help.",
      improvements: "Could share knowledge more broadly via documentation.",
      comments: "Fatima is a pleasure to work with.",
    },
  });
  await prisma.reviewFeedback.create({
    data: {
      tenantId: tenant1.id, cycleId: cycle.id,
      fromEmployeeId: empFatima.id, toEmployeeId: empSara.id,
      type: ReviewerType.PEER, rating: 4,
      strengths: "Supportive manager who trusts the team.",
      improvements: "Could provide more frequent feedback.",
      comments: "Sara gives us autonomy which I appreciate.",
    },
  });

  console.log("Seed complete.");
  console.log("Login accounts (password: Password123!):");
  console.log("  superadmin@attendance.app  (SUPER_ADMIN)");
  console.log("  admin@gulftech.com         (ADMIN)");
  console.log("  manager@gulftech.com       (MANAGER)");
  console.log("  staff@gulftech.com         (STAFF)");
  console.log("  employee@gulftech.com      (EMPLOYEE)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
