import Application from "@ioc:Adonis/Core/Application";
import * as fsExtra from "fs-extra";
import {
  CLIP_FOLDER,
  MERGEDVIDEO_FOLDER,
  TRENDS_DOWNLOAD_QUANTITY,
  CROPPEDVIDEO_FOLDER,
  VIDEO_FORMAT,
  DOWNLOAD_FOLDER,
  TEMP_FOLDER,
  TITLE_FOLDER,
  DURATION_PER_VIDEO,
  INTRO_VIDEO,
} from "./../Config/settings";
import ytbservice from "@ioc:App/Services/YTBService";
import {
  addTextOnVideo,
  cutVideo,
  mergeClips,
  videoScale,
} from "App/Utils/VideoEditing";
import fs from "fs";

// const cron = require("node-cron");

interface video {
  id: string;
  name: string;
  channelName: string;
  time: number;
  currentPath?: string;
  position: number;
}

export class CreateVideoService {
  constructor() {
    // cron.schedule("*/10 * * * * *", async () => {
    this.start();
    // });
  }

  async start() {
    let videos: video[] = [];

    // this.clearFolders();

    // videos = await this.getTrends();
    // videos = await this.downloadVideos(videos);
    // videos = this.getValidVideos(videos);
    // videos = this.getSlicedVideos(videos);
    // videos = await this.clipVideos(videos);
    // videos = await this.cropVideos(videos);

    videos = [
      {
        id: "h8DLofLM7No",
        name: "Taylor Swift - Lavender Haze",
        time: 211,
        channelName: "TaylorSwiftVEVO",
        position: 0,
        currentPath:
          "/Users/vincenzobonaccorso/Sites/TopTrends/tmp/Cropped/h8DLofLM7No.mp4",
      },
      {
        id: "P9tKTxbgdkk",
        name: "TXT (투모로우바이투게더) 'Sugar Rush Ride' Official MV",
        time: 213,
        channelName: "HYBE LABELS",
        position: 1,
        currentPath:
          "/Users/vincenzobonaccorso/Sites/TopTrends/tmp/Cropped/P9tKTxbgdkk.mp4",
      },
      {
        id: "5Dh_9k4Ma2w",
        name: "I built EVERY MINECRAFT structure in LEGO...",
        time: 611,
        channelName: "TD BRICKS",
        position: 2,
        currentPath:
          "/Users/vincenzobonaccorso/Sites/TopTrends/tmp/Cropped/5Dh_9k4Ma2w.mp4",
      },
      {
        id: "V3vZfEhWSdw",
        name: "Chlöe - Pray It Away (Official Video)",
        time: 156,
        channelName: "ChloeBaileyVEVO",
        position: 3,
        currentPath:
          "/Users/vincenzobonaccorso/Sites/TopTrends/tmp/Cropped/V3vZfEhWSdw.mp4",
      },
      {
        id: "ZGNj5lOtNnI",
        name: "Extremely Satisfying Workers!",
        time: 486,
        channelName: "Beast Reacts",
        position: 4,
        currentPath:
          "/Users/vincenzobonaccorso/Sites/TopTrends/tmp/Cropped/ZGNj5lOtNnI.mp4",
      },
    ];

    videos = await this.addText(videos);
    videos = this.addIntro(videos);

    const merged = await this.mergeVideos(videos);

    console.log(merged);
  }

  addIntro(data: video[]): video[] {
    const intro: video = {
      id: "intro",
      name: "intro",
      channelName: "intro",
      time: 100,
      position: 0,
      currentPath: INTRO_VIDEO,
    };

    return [intro, ...data];
  }

  getValidVideos(data: video[]): video[] {
    return data.filter((v) => v.currentPath);
  }

  getSlicedVideos(data: video[]): video[] {
    return data.sort((a, b) => a.position - b.position).slice(0, 5);
  }

  async cropVideos(data: video[]): Promise<video[]> {
    return await Promise.all(
      data.map(async (video) => {
        try {
          console.log("Start cropping", video.id);
          video.currentPath = await videoScale(
            video.currentPath!,
            `${CROPPEDVIDEO_FOLDER}/${video.id}.${VIDEO_FORMAT}`,
            1080,
            1920
          );
        } catch (error) {
          console.log("Error cropping", video.id);
        }
        return video;
      })
    );
  }

  async mergeVideos(data: video[]): Promise<string> {
    const mergedoutput = `${MERGEDVIDEO_FOLDER}/Merged.${VIDEO_FORMAT}`;
    return await mergeClips(
      data.map((video) => video.currentPath) as string[],
      mergedoutput
    );
  }

  async addText(data: video[]): Promise<video[]> {
    return await Promise.all(
      data.map(async (video) => {
        try {
          console.log("Start Adding Text", video.id);
          video.currentPath = await addTextOnVideo(
            video.currentPath!,
            `${TITLE_FOLDER}/${video.id}.${VIDEO_FORMAT}`,
            video.name,
            video.channelName
          );
        } catch (error) {
          console.log("Text not added", video.id);
        }
        return video;
      })
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

  async getTrends(): Promise<video[]> {
    const trends = await ytbservice.getTopTrends(TRENDS_DOWNLOAD_QUANTITY);
    const data = await Promise.all(
      trends.items.map(async (e, key) => {
        const time = await ytbservice.getDuration(e.id);
        const video: video = {
          id: e.id,
          name: e.snippet.title,
          time: time,
          channelName: e.snippet.channelTitle,
          position: key,
        };

        return video;
      })
    );

    return data;
  }

  async downloadVideos(data: video[]): Promise<video[]> {
    return await Promise.all(
      data.map(async (video) => {
        try {
          console.log("Start Download", video.id);
          video.currentPath = await ytbservice.download(video.id);
        } catch (error) {
          console.log("Error Downlaoding", video.id);
        }
        return video;
      })
    );
  }

  async clipVideos(data: video[]): Promise<video[]> {
    return await Promise.all(
      data.map(async (video) => {
        try {
          console.log("Start clipping", video.id);

          const start = Math.floor(video.time / 2);
          const end = start + DURATION_PER_VIDEO;
          const outputPath = `${CLIP_FOLDER}/${video.id}.${VIDEO_FORMAT}`;
          await cutVideo(video.currentPath!, outputPath, start, end);
          video.currentPath = outputPath;
        } catch (error) {
          console.log("Error clipping", video.id);
        }
        return video;
      })
    );
  }
}
