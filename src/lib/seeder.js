
import { client } from '@/api/amplifyClient';

const boundariesData = [
    { name: "Core Production Boundary", category: "PROD", description: "Critical production systems processing sensitive data." },
    { name: "Development & Testing Environments", category: "NON_PROD", description: "Sandboxed environments for development and testing." },
    { name: "Shared Logging & Monitoring", category: "PROD", description: "Centralized logging and security monitoring infrastructure." },
    { name: "Internal Network Boundary", category: "PROD", description: "Internal employee-facing tools and intranet." },
    { name: "Production Environment Boundary", category: "PROD", description: "General production environment for supporting services." },
    { name: "Third-Party Payment Gateway", category: "EXTERNAL", description: "External accreditation boundary for payment processing." },
    { name: "Customer Portal System", category: "PROD", description: "Public-facing customer access boundary." }
];

const systemsData = [
    {
        name: "Data Lake & Analytics",
        acronym: "DATALAKE",
        description: "S3-based data lake with AWS Glue ETL and Athena for analytics, supporting compliance and reporting workloads.",
        boundary: "Core Production Boundary",
        environment: "PROD",
        owner: "System Administrator",
        activeStatus: "Active",
        findings: []
    },
    {
        name: "EKS Kubernetes Platform",
        acronym: "EKS-PLAT",
        description: "Amazon EKS managed Kubernetes service hosting containerized applications with RBAC and network policies.",
        boundary: "Core Production Boundary",
        environment: "PROD",
        owner: "System Administrator",
        activeStatus: "Active",
        findings: [
            { title: "Privileged Container Mode Allowed", severity: "HIGH", status: "OPEN" }
        ]
    },
    {
        name: "IAM / SSO Access Platform",
        acronym: "IAM-SSO",
        description: "AWS IAM and SSO platform providing identity and access management across the organization with Okta integration.",
        boundary: "Production Environment Boundary",
        environment: "PROD",
        owner: "ISSO",
        activeStatus: "Active",
        findings: [
            { title: "Over-privileged Roles Detected", severity: "HIGH", status: "OPEN" }
        ]
    },
    {
        name: "Serverless API Platform",
        acronym: "SVLS-API",
        description: "API Gateway and Lambda-based serverless platform serving microservices and third-party integrations.",
        boundary: "Core Production Boundary",
        environment: "PROD",
        owner: "ISSM",
        activeStatus: "Active",
        findings: []
    },
    {
        name: "Cloud Logging & SIEM Pipeline",
        acronym: "LOG-SIEM",
        description: "Centralized logging pipeline using CloudWatch, S3, and Splunk SIEM for security event aggregation and compliance logging.",
        boundary: "Shared Logging & Monitoring",
        environment: "PROD",
        owner: "ISSE",
        activeStatus: "Active",
        findings: [
            { title: "Log Retention < 365 Days", severity: "MODERATE", status: "OPEN" }
        ]
    },
    {
        name: "AWS Landing Zone & Control Tower",
        acronym: "LZ-CT",
        description: "AWS Organizations and Control Tower implementation providing centralized governance, account management, and baseline security controls.",
        boundary: "Production Environment Boundary",
        environment: "PROD",
        owner: "System Administrator",
        activeStatus: "Active",
        findings: [
            { title: "MFA Not Enforced on Root Account", severity: "CRITICAL", status: "OPEN" }
        ]
    },
    {
        name: "Vulnerability Scanning & Patch Compliance",
        acronym: "VULN-PATCH",
        description: "AWS Inspector, SSM Patch Manager, and Config providing continuous vulnerability assessment and patch compliance.",
        boundary: "Shared Logging & Monitoring",
        environment: "PROD",
        owner: "System Administrator",
        activeStatus: "Active",
        findings: []
    },
    {
        name: "Secrets & Key Management",
        acronym: "KMS-SECR",
        description: "AWS KMS and Secrets Manager providing cryptographic key management and secret rotation across all services.",
        boundary: "Production Environment Boundary",
        environment: "PROD",
        owner: "ISSO",
        activeStatus: "Active",
        findings: []
    },
    {
        name: "Document Management Platform",
        acronym: "DMP",
        description: "Enterprise document repository supporting access control and retention policies.",
        boundary: "Core Production Boundary",
        environment: "PROD",
        owner: "System Administrator",
        activeStatus: "Active",
        findings: []
    },
    {
        name: "Customer Portal Application",
        acronym: "CPA",
        description: "Public-facing customer portal used for account access and service requests.",
        boundary: "Customer Portal System",
        environment: "PROD",
        owner: "Product Manager",
        activeStatus: "Active",
        findings: [
            { title: "XSS Vulnerability in Search", severity: "CRITICAL", status: "OPEN" }
        ]
    },
    {
        name: "Internal HR Management System",
        acronym: "IHRMS",
        description: "Internal HR platform for employee records, onboarding, and time management.",
        boundary: "Internal Network Boundary",
        environment: "PROD",
        owner: "IT Manager",
        activeStatus: "Active",
        findings: []
    },
    {
        name: "Windows Server Fleet",
        acronym: "WIN-SRV",
        description: "Windows Server systems providing AD-integrated services and application hosting.",
        boundary: "Production Environment Boundary",
        environment: "PROD",
        owner: "System Administrator",
        activeStatus: "Active",
        findings: []
    },
    {
        name: "Linux Server Fleet",
        acronym: "LINUX-SRV",
        description: "RHEL-based server fleet supporting core services and internal tooling.",
        boundary: "Production Environment Boundary",
        environment: "PROD",
        owner: "System Administrator",
        activeStatus: "Active",
        findings: []
    },
    {
        name: "Payment Processor Integration",
        acronym: "PAY-GW",
        description: "Integration with third-party payment providers.",
        boundary: "Third-Party Payment Gateway",
        environment: "PROD",
        owner: "Product Owner",
        activeStatus: "Active",
        findings: []
    }
];

function calculateDueDate(severity) {
    const date = new Date();
    const days = { 'CRITICAL': 7, 'HIGH': 30, 'MODERATE': 90, 'LOW': 180 };
    date.setDate(date.getDate() + (days[severity] || 90));
    return date.toISOString();
}

export async function seedDatabase(currentUserEmail = null) {
    console.log("Starting frontend database seed...");
    let logs = [];
    const log = (msg) => {
        console.log(msg);
        logs.push(msg);
    };

    // ... (existing seeding logic) ...
    // I need to be careful with range replacement.
    // It's safer to just update the signature and the Admin promotion block.
    // But the previous content has the whole function start.
    // I'll target the signature line first, then the admin promotion block.
    // Wait, replace_file_content is single contiguous block.
    // seeder.js is ~280 lines.
    // I will use multi_replace for safety if needed, or just replace the specific chunks.
    // Actually, the previous tool output for seeder.js shows lines 174 is signature.
    // And lines 247 is the admin block.
    // They are far apart. Using multi_replace.


    try {
        // 1. Seed Boundaries
        const { data: existingBoundaries } = await client.models.Boundary.list();
        const existingBoundaryNames = new Set(existingBoundaries.map(b => b.name));

        for (const bData of boundariesData) {
            if (existingBoundaryNames.has(bData.name)) {
                log(`Skipping Boundary (exists): ${bData.name}`);
                continue;
            }
            const { errors } = await client.models.Boundary.create({
                name: bData.name,
                boundaryCategory: bData.category,
                description: bData.description
            });
            if (errors) log(`Error creating boundary ${bData.name}: ${JSON.stringify(errors)}`);
            else log(`Created Boundary: ${bData.name}`);
        }

        // 2. Seed Systems
        const { data: existingSystems } = await client.models.System.list();
        const existingSystemNames = new Set(existingSystems.map(s => s.name));

        for (const sysData of systemsData) {
            if (existingSystemNames.has(sysData.name)) {
                log(`Skipping System (exists): ${sysData.name}`);
                continue;
            }

            const { data: system, errors } = await client.models.System.create({
                name: sysData.name,
                acronym: sysData.acronym,
                description: sysData.description,
                environment: sysData.environment,
                ownerName: sysData.owner,
                boundary: sysData.boundary,
                activeStatus: sysData.activeStatus
            });

            if (errors) {
                log(`Error creating system ${sysData.acronym}: ${JSON.stringify(errors)}`);
                continue;
            }
            log(`Created System: ${system.name}`);

            // 3. Seed Findings
            for (const f of sysData.findings) {
                await client.models.Finding.create({
                    systemId: system.id,
                    systemName: system.name,
                    title: f.title,
                    description: `Generated finding for ${system.acronym}`,
                    severity: f.severity,
                    status: f.status,
                    dueDate: calculateDueDate(f.severity),
                    controlId: "AC-1",
                    impact: "HIGH",
                    likelihood: "MEDIUM",
                    source: "MANUAL_REVIEW"
                });
                log(`  - Added Finding: ${f.title}`);
            }
        }

        // 4. Promote Current User to ADMIN
        try {
            let email = currentUserEmail;
            if (!email) {
                try {
                    const { getCurrentUser } = await import('aws-amplify/auth');
                    const authUser = await getCurrentUser();
                    email = authUser.signInDetails?.loginId;
                } catch (e) {
                    log("Could not auto-detect user for admin promotion (no email passed).");
                }
            }

            if (email) {
                const { data: users } = await client.models.User.list({
                    filter: { email: { eq: email } }
                });

                if (users.length > 0) {
                    await client.models.User.update({
                        id: users[0].id,
                        role: 'ADMIN'
                    });
                    log(`Promoted user ${email} to ADMIN`);
                } else {
                    await client.models.User.create({
                        email: email,
                        role: 'ADMIN',
                        status: 'ACTIVE'
                    });
                    log(`Created ADMIN user for ${email}`);
                }
            }
        } catch (authErr) {
            log(`Skipping admin promotion: ${authErr.message}`);
        }

        return { success: true, logs };
    } catch (err) {
        log(`Seeding failed: ${err.message}`);
        return { success: false, logs, error: err };
    }
