import "dotenv/config";
import jwt from "jsonwebtoken";
import { exec } from "child_process";

const jwtSecret = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const token = jwt.sign({ userId: 1, email: "test@example.com" }, jwtSecret, { expiresIn: "1h" });

console.log(`Token generated.`);
const command = `curl -v -H "Authorization: Bearer ${token}" http://localhost:4000/api/user-inventory`;

exec(command, (error, stdout, stderr) => {
    if (error) {
        console.error(`exec error: ${error}`);
        return;
    }
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
});
