import cron from "node-cron";

let initialized = false;

export function startCronJobs() {
  if (initialized) return;
  initialized = true;

  // Monthly birthday reminders — 1st of each month at 9:00 AM
  cron.schedule("0 9 1 * *", async () => {
    console.log("[Cron] Sending birthday reminders...");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/notifications?type=birthday`
      );
      const data = await res.json();
      console.log("[Cron] Birthday reminder result:", data);
    } catch (error) {
      console.error("[Cron] Birthday reminder failed:", error);
    }
  });

  // Weekly Christmas status — every Monday in December at 9:00 AM
  cron.schedule("0 9 * 12 1", async () => {
    console.log("[Cron] Sending Christmas status...");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/notifications?type=christmas`
      );
      const data = await res.json();
      console.log("[Cron] Christmas status result:", data);
    } catch (error) {
      console.error("[Cron] Christmas status failed:", error);
    }
  });

  console.log("[Cron] Scheduled notification jobs.");
}
