import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

async function main() {
    const org = await prisma.organization.upsert({
        where: { slug: "bluePixel" },
        update: {},
        create: {
            name: "Blue Pixel",
            slug: "bluePixel",
        },
    });

    const adminPassword = await bcrypt.hash("admin123", 10);
    const memeberPassword = await bcrypt.hash("member123", 10);

    await prisma.user.upsert({
        where: { email: "admin@bluepixel.com" },
        update: {},
        create: {
            email: "admin@bluepixel.com",
            name: "Admin User",
            password: adminPassword,
            role: "ADMIN",
            organizationId: org.id,
        },
    });

    await prisma.user.upsert({
        where: { email: "member@bluepixel.com" },
        update: {},
        create: {
            email: "member@bluepixel.com",
            name: "Member User",
            password: memeberPassword,
            role: "MEMBER",
            organizationId: org.id,
        },
    });

    console.log("Seed completed!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });