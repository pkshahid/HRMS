import { PrismaClient, CycleType, CycleStatus, ReviewStatus, ReviewerType, GoalType, GoalStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.findUnique({ where: { slug: "gulf-tech" } });
  if (!tenant) throw new Error("Tenant gulf-tech not found. Run the main seed first.");

  const employees = await prisma.employee.findMany({ where: { tenantId: tenant.id } });
  const byEmail = (e: string) => employees.find((x) => x.email === e)!;
  const empAhmed = byEmail("admin@gulftech.com");
  const empSara = byEmail("manager@gulftech.com");
  const empOmar = byEmail("staff@gulftech.com");
  const empFatima = byEmail("employee@gulftech.com");

  // clean slate for performance
  await prisma.reviewFeedback.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.performanceGoal.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.performanceReview.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.performanceCycle.deleteMany({ where: { tenantId: tenant.id } });

  const competencies = [
    { name: "Job Knowledge", description: "Demonstrates understanding of role and responsibilities" },
    { name: "Quality of Work", description: "Produces accurate, thorough, high-quality output" },
    { name: "Productivity", description: "Completes work efficiently and meets deadlines" },
    { name: "Teamwork", description: "Collaborates effectively with colleagues" },
    { name: "Communication", description: "Communicates clearly and professionally" },
    { name: "Initiative", description: "Takes proactive action and shows ownership" },
  ];

  const year = new Date().getFullYear();
  const cycle = await prisma.performanceCycle.create({
    data: {
      tenantId: tenant.id,
      name: `${year} Annual Review`,
      type: CycleType.ANNUAL,
      status: CycleStatus.REVIEW_IN_PROGRESS,
      periodStart: new Date(year, 0, 1),
      periodEnd: new Date(year, 11, 31),
      selfReviewStart: new Date(year, 11, 1),
      selfReviewEnd: new Date(year, 11, 15),
      managerReviewStart: new Date(year, 11, 16),
      managerReviewEnd: new Date(year, 11, 28),
      ratingScale: "5",
      competencies: competencies as any,
    },
  });

  const reviewDefs = [
    { emp: empSara, reviewer: empAhmed, selfDone: true, mgrDone: true, final: 4 },
    { emp: empFatima, reviewer: empSara, selfDone: true, mgrDone: false, final: null as number | null },
    { emp: empOmar, reviewer: empAhmed, selfDone: false, mgrDone: false, final: null as number | null },
  ];

  for (const r of reviewDefs) {
    const status = r.mgrDone ? ReviewStatus.COMPLETED : r.selfDone ? ReviewStatus.MANAGER_REVIEW_PENDING : ReviewStatus.SELF_REVIEW_PENDING;
    await prisma.performanceReview.create({
      data: {
        tenantId: tenant.id,
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
          selfSubmittedAt: new Date(year, 11, 10),
        } : {}),
        ...(r.mgrDone ? {
          managerRating: r.final ?? 4,
          managerStrengths: "Consistently delivers high-quality work and demonstrates strong leadership.",
          managerImprovements: "Should focus on strategic planning and developing successors.",
          managerAchievements: "Exceeded all quarterly targets and successfully led the team through a major transition.",
          managerComments: "A key contributor to the team's success. Ready for expanded responsibilities.",
          managerSubmittedAt: new Date(year, 11, 20),
          competencyScores: competencies.map((c, i) => ({ name: c.name, score: 4 + (i % 2), comment: "" })) as any,
          finalRating: r.final,
          finalComments: r.final ? "Strong performer — recommend for promotion consideration." : null,
          recommendations: r.final && r.final >= 4 ? "Promotion consideration" : null,
          completedAt: new Date(year, 11, 22),
        } : {}),
      },
    });
  }

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
        tenantId: tenant.id,
        employeeId: g.emp.id,
        cycleId: cycle.id,
        title: g.title,
        type: g.type,
        status: g.status,
        progress: g.progress,
        weight: g.weight,
        targetValue: g.target,
        actualValue: g.actual,
        startDate: new Date(year, 0, 1),
        dueDate: new Date(year, 11, 31),
        completedAt: g.status === GoalStatus.ACHIEVED ? new Date(year, 10, 30) : null,
      },
    });
  }

  await prisma.reviewFeedback.create({
    data: {
      tenantId: tenant.id, cycleId: cycle.id,
      fromEmployeeId: empOmar.id, toEmployeeId: empFatima.id,
      type: ReviewerType.PEER, rating: 5,
      strengths: "Excellent collaborator and always willing to help.",
      improvements: "Could share knowledge more broadly via documentation.",
      comments: "Fatima is a pleasure to work with.",
    },
  });
  await prisma.reviewFeedback.create({
    data: {
      tenantId: tenant.id, cycleId: cycle.id,
      fromEmployeeId: empFatima.id, toEmployeeId: empSara.id,
      type: ReviewerType.PEER, rating: 4,
      strengths: "Supportive manager who trusts the team.",
      improvements: "Could provide more frequent feedback.",
      comments: "Sara gives us autonomy which I appreciate.",
    },
  });

  console.log("Performance seed complete.");
  console.log(`  Cycle: ${cycle.name}`);
  console.log(`  Reviews: ${reviewDefs.length}`);
  console.log(`  Goals: ${goalDefs.length}`);
  console.log(`  Feedback: 2`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
