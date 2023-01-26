import {
  CLIP_FOLDER,
  DOWNLOAD_FOLDER,
  TRENDS_QUANTITY,
  VIDEO_FORMAT,
} from "./../Config/settings";
import ytbservice from "@ioc:App/Services/YTBService";
import { cutVideo } from "App/Utils/Generic";
const fs = require("fs");
// const cron = require("node-cron");

export class CreateVideoService {
  constructor() {
    // cron.schedule("*/10 * * * * *", async () => {
    this.start();
    // });
  }

  async start() {
    this.clearFolders();

    const trends = await this.getTrends();
    const clipped = await this.downloadAndClip(trends);

    console.log(clipped);
  }

  clearFolders() {
    fs.readdirSync(CLIP_FOLDER).forEach((f) =>
      fs.rmSync(`${CLIP_FOLDER}/${f}`)
    );
    fs.readdirSync(DOWNLOAD_FOLDER).forEach((f) =>
      fs.rmSync(`${DOWNLOAD_FOLDER}/${f}`)
    );
  }

  async getTrends() {
    const trends = await ytbservice.getTopTrends(TRENDS_QUANTITY);
    const data = await Promise.all(
      trends.items.map(async (e) => {
        const time = await ytbservice.getDuration(e.id);
        return {
          name: e.snippet.title,
          id: e.id,
          time: time,
        };
      })
    );

    return data;
  }

  async downloadAndClip(data) {
    return await Promise.all(
      data.map(async (video) => {
        try {
          console.log("Start Download", video.id);

          const start = Math.floor(video.time / 2 - 1);
          const end = Math.floor(video.time / 2 + 1);
          const path = await ytbservice.download(video.id);

          console.log("Start Clip", video.id);
          const outputPath = `${CLIP_FOLDER}/${video.id}.${VIDEO_FORMAT}`;
          await cutVideo(path, outputPath, start, end);

          video.clipPath = outputPath;

          console.log("End Download + Clip", video.id);
        } catch (error) {
          console.log("Error Downlaoding and Cutting", video.id);
        }
        return video;
      })
    );
  }
}
