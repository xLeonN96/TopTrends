import Application from "@ioc:Adonis/Core/Application";
import * as fsExtra from "fs-extra";
import {
  CLIP_FOLDER,
  MERGEDVIDEO_FOLDER,
  TRENDS_QUANTITY,
  CROPPEDVIDEO_FOLDER,
  VIDEO_FORMAT,
  DOWNLOAD_FOLDER,
  TEMP_FOLDER,
  TITLE_FOLDER,
} from "./../Config/settings";
import ytbservice from "@ioc:App/Services/YTBService";
import { cutVideo, mergeClips, videoScale } from "App/Utils/VideoEditing";
import fs from "fs";

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
    const filtered = this.filter(clipped);
    const cropped = await this.cropVideos(filtered);
    const merged = await this.mergeVideos(cropped);
    console.log(merged);
    // const clipped = [
    //   {
    //     name: "Developer_Direct, presented by Xbox & Bethesda",
    //     id: "4-Et8r1413Y",
    //     time: 2641,
    //     channelname: "Xbox",
    //     clipPath:
    //       "C:\\Users\\Leonardo\\Projects\\TopTrendù\\tmp/Clip/Si8zRaa8vis.mp4",
    //   },
    //   {
    //     name: "Natalie Noel's 6 Month Body Transformation",
    //     id: "_VYqksya-78",
    //     time: 1648,
    //     channelname: "Xeela Fitness",
    //     clipPath:
    //       "C:\\Users\\Leonardo\\Projects\\TopTrendù\\tmp/Clip/_VYqksya-78.mp4",
    //   },
    //   {
    //     name: "GRIZZLIES at WARRIORS | FULL GAME HIGHLIGHTS | January 25, 2023",
    //     id: "GcI0k8bRnEw",
    //     time: 590,
    //     channelname: "NBA",
    //     clipPath:
    //       "C:\\Users\\Leonardo\\Projects\\TopTrendù\\tmp/Clip/L7spCJxloLY.mp4",
    //   },
    //   {
    //     name: "Mark Briscoe and Jay Lethal Pay Tribute to Jay Briscoe | AEW Dynamite. 1/25/23",
    //     id: "uBhuDdbfCEs",
    //     time: 531,
    //     channelname: "All Elite Wrestling",
    //     clipPath:
    //       "C:\\Users\\Leonardo\\Projects\\TopTrendù\\tmp/Clip/uBhuDdbfCEs.mp4",
    //   },
    //   {
    //     name: "Fortnite GUESS WHO vs Nick EH 30!",
    //     id: "lS1U4XCjOc0",
    //     time: 1374,
    //     channelname: "More CouRage",
    //     clipPath:
    //       "C:\\Users\\Leonardo\\Projects\\TopTrendù\\tmp/Clip/lS1U4XCjOc0.mp4",
    //   },
    // ];
  }

  filter(data) {
    return data
      .map((video) => video.clipPath)
      .filter((video) => video)
      .slice(0, 5);
  }

  async cropVideos(data) {
    return await Promise.all(
      data.map(async (video) => {
        video.scaledPath = await videoScale(
          video.clipPath,
          `CROPPEDVIDEO_FOLDER/${video.id}.mp4`,
          1080,
          1920
        );
        return video;
      })
    );
  }

  async mergeVideos(data) {
    const mergedoutput = MERGEDVIDEO_FOLDER + "/Merged.mp4";
    return await mergeClips(
      data.map((video) => video.clipPath) as string[],
      mergedoutput
    );
  }

  clearFolders() {
    fsExtra.emptyDirSync(Application.tmpPath());
    fs.mkdirSync(CLIP_FOLDER);
    fs.mkdirSync(DOWNLOAD_FOLDER);
    fs.mkdirSync(MERGEDVIDEO_FOLDER);
    fs.mkdirSync(CROPPEDVIDEO_FOLDER);
    fs.mkdirSync(TEMP_FOLDER);
    fs.mkdirSync(TITLE_FOLDER);
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
          channelname: e.snippet.channelTitle,
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
