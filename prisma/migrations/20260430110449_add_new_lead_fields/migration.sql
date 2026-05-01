-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "initials" TEXT NOT NULL,
    "empId" TEXT NOT NULL,
    "managerId" INTEGER,
    "dob" TEXT,
    "doj" TEXT,
    "email" TEXT,
    "address" TEXT,
    "contact" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "deactReason" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" SERIAL NOT NULL,
    "account_no" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "alt_mobile" TEXT,
    "alt_mobile_2" TEXT,
    "alt_mobile_3" TEXT,
    "alt_mobile_4" TEXT,
    "email" TEXT,
    "pan" TEXT,
    "product" TEXT,
    "bank" TEXT,
    "outstanding" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "principle_outstanding" DOUBLE PRECISION,
    "min_amt_due" DOUBLE PRECISION,
    "dpd" INTEGER NOT NULL DEFAULT 0,
    "bkt_2" TEXT,
    "product_npa" TEXT,
    "date_of_npa" TEXT,
    "linkage" TEXT,
    "upgrade_reason" TEXT,
    "eligible_upgrade" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "city" TEXT,
    "state" TEXT,
    "dob" TEXT,
    "gender" TEXT,
    "address" TEXT,
    "employer" TEXT,
    "salary" DOUBLE PRECISION,
    "metadata" JSONB,
    "assignedAgentId" INTEGER,
    "portfolioId" TEXT,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadColumn" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "type" TEXT NOT NULL DEFAULT 'text',
    "style" JSONB,

    CONSTRAINT "LeadColumn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "mode" TEXT NOT NULL,
    "ref" TEXT,
    "date" TEXT NOT NULL,
    "agentId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending_approval',
    "remarks" TEXT,
    "flag" TEXT,
    "flagBy" INTEGER,
    "flagComment" TEXT,
    "rejectionReason" TEXT,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PTP" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "agentId" INTEGER NOT NULL,
    "voc" TEXT,
    "remarks" TEXT,
    "flag" TEXT,
    "flagComment" TEXT,
    "rejectionReason" TEXT,
    "created" TEXT NOT NULL,

    CONSTRAINT "PTP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispute" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "raisedDate" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "agentId" INTEGER NOT NULL,
    "description" TEXT,
    "resolution" TEXT,
    "flag" TEXT,
    "flagComment" TEXT,
    "escalated" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Portfolio" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Portfolio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PortfolioAgents" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_PortfolioManagers" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_empId_key" ON "User"("empId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_account_no_key" ON "Customer"("account_no");

-- CreateIndex
CREATE UNIQUE INDEX "LeadColumn_key_key" ON "LeadColumn"("key");

-- CreateIndex
CREATE UNIQUE INDEX "_PortfolioAgents_AB_unique" ON "_PortfolioAgents"("A", "B");

-- CreateIndex
CREATE INDEX "_PortfolioAgents_B_index" ON "_PortfolioAgents"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_PortfolioManagers_AB_unique" ON "_PortfolioManagers"("A", "B");

-- CreateIndex
CREATE INDEX "_PortfolioManagers_B_index" ON "_PortfolioManagers"("B");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_assignedAgentId_fkey" FOREIGN KEY ("assignedAgentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PTP" ADD CONSTRAINT "PTP_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PTP" ADD CONSTRAINT "PTP_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PortfolioAgents" ADD CONSTRAINT "_PortfolioAgents_A_fkey" FOREIGN KEY ("A") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PortfolioAgents" ADD CONSTRAINT "_PortfolioAgents_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PortfolioManagers" ADD CONSTRAINT "_PortfolioManagers_A_fkey" FOREIGN KEY ("A") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PortfolioManagers" ADD CONSTRAINT "_PortfolioManagers_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
