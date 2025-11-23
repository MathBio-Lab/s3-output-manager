import "dotenv/config";

console.log("POSTGRES_HOST:", process.env.POSTGRES_HOST);
console.log("POSTGRES_PORT:", process.env.POSTGRES_PORT);
console.log("POSTGRES_USER:", process.env.POSTGRES_USER);
console.log("POSTGRES_DB:", process.env.POSTGRES_DB);
if (process.env.POSTGRES_PASSWORD) {
    console.log("Password char codes:", process.env.POSTGRES_PASSWORD.split('').map(c => c.charCodeAt(0)));
} else {
    console.log("Password is undefined");
}
console.log("Connection String:", `postgresql://${process.env.POSTGRES_USER}:***@${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}`);
