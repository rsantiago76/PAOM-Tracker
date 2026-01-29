import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { readFile } from 'fs/promises';
import { WebSocket } from 'ws';

// Polyfill WebSocket for Node.js environment
global.WebSocket = WebSocket;

// Load configuration
const config = JSON.parse(await readFile('./amplify_outputs.json', 'utf8'));
Amplify.configure(config);

const client = generateClient();

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
        boundary: "Shared Services", // Keeping as Shared Services per typical mapping, or could map to Production Env. Using 'Production Environment Boundary' to align with new set if strictly needed, but 'Shared Services' was in original seed. Let's use 'Production Environment Boundary' as it's Infrastructure. Actually, let's stick to the new boundaries: 'Production Environment Boundary' fits best for shared infra.
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

async function seed() {
    try {
        console.log("Seeding AWS Systems & Boundaries...");

        // Create Boundaries
        for (const bData of boundariesData) {
            const { errors } = await client.models.Boundary.create({
                name: bData.name,
                boundaryCategory: bData.category,
                description: bData.description
            });
            if (errors) console.error(`Error creating boundary ${bData.name}:`, errors);
            else console.log(`Created Boundary: ${bData.name}`);
        }

        for (const sysData of systemsData) {
            // Create System
            const { data: system, errors } = await client.models.System.create({
                name: sysData.name,
                acronym: sysData.acronym,
                description: `AWS ${sysData.acronym} System`,
                environment: sysData.environment,
                ownerName: sysData.owner, // using ownerName for simple display
                boundary: sysData.boundary,
                activeStatus: sysData.activeStatus
            });

            if (errors) {
                console.error(`Error creating system ${sysData.acronym}:`, errors);
                continue;
            }
            console.log(`Created System: ${system.name} (${system.id})`);

            // Create Findings
            for (const f of sysData.findings) {
                await client.models.Finding.create({
                    systemId: system.id,
                    systemName: system.name,
                    title: f.title,
                    description: `Generated finding for ${system.acronym}`,
                    severity: f.severity,
                    status: f.status,
                    dueDate: calculateDueDate(f.severity),
                    controlId: "AC-1", // Placeholder
                    impact: "HIGH",
                    likelihood: "MEDIUM",
                    source: "MANUAL_REVIEW"
                });
                console.log(`  - Added Finding: ${f.title}`);
            }
        }
        console.log("Seeding Complete.");
    } catch (error) {
        console.error("Seeding failed:", error);
    }
}

seed();
