import ytbservice from "@ioc:App/Services/YTBService";
import { ISO8601ToSeconds, cutVideo } from "App/Utils/Generic";
const fs = require("fs");
import Application from "@ioc:Adonis/Core/Application";
// const cron = require("node-cron");

export class CreateVideoService {
  constructor() {
    // cron.schedule("*/10 * * * * *", async () => {
    this.start();
    // });
  }
  async start() {
    fs.readdirSync(Application.tmpPath() + "/Crop/").forEach((f) =>
      fs.rmSync(`${Application.tmpPath() + "/Crop/"}/${f}`)
    );
    fs.readdirSync(Application.tmpPath() + "/Download/").forEach((f) =>
      fs.rmSync(`${Application.tmpPath() + "/Download/"}/${f}`)
    );

    const trends = await ytbservice.getTopTrends(5);
    const data = await Promise.all(
      trends.items.map(async (e) => {
        const duration = await ytbservice.getDuration(e.id);
        const time = ISO8601ToSeconds(
          duration.items[0].contentDetails.duration
        );
        return {
          name: e.snippet.title,
          id: e.id,
          time: time,
        };
      })
    );

    await Promise.all(
      data.map(async (video) => {
        try {
          console.log("Start Download", video.id);

          const start = Math.floor(video.time / 2 - 1);
          const end = Math.floor(video.time / 2 + 1);
          const path = await ytbservice.download(video.id);

          console.log("Start Crop", video.id);
          await cutVideo(path, start, end);

          console.log("End Download + Crop", video.id);
        } catch (error) {
          console.log("Error Downlaoding and Cutting", video.id);
        }
      })
    );
  }
}
