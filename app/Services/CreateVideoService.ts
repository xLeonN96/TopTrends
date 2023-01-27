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
    // this.clearFolders();

    // const trends = await this.getTrends();
    // const downloaded = await this.downloadVideos(trends);
    // const valid = this.getValidVideos(downloaded);
    // const sliced = this.getSlicedVideos(valid);
    // const clipped = await this.clipVideos(sliced);
    // const cropped = await this.cropVideos(clipped);
    const cropped = [
      {
        id: "NzlTuDX7veY",
        name: "Anna Kendrick Gets the Giggles While Eating Spicy Wings | Hot Ones",
        time: 1473,
        channelName: "First We Feast",
        position: 0,
        currentPath:
          "C:\\Users\\Leonardo\\Projects\\TopTrendù\\tmp/Cropped/NzlTuDX7veY.mp4",
      },
      {
        id: "AIc671o9yCI",
        name: "SHAZAM! FURY OF THE GODS - Official Trailer 2",
        time: 151,
        channelName: "Warner Bros. Pictures",
        position: 2,
        currentPath:
          "C:\\Users\\Leonardo\\Projects\\TopTrendù\\tmp/Cropped/AIc671o9yCI.mp4",
      },
      {
        id: "sWlURhM5P5Q",
        name: "Succession Season 4 | Official Teaser Trailer | HBO",
        time: 94,
        channelName: "HBO Max",
        position: 3,
        currentPath:
          "C:\\Users\\Leonardo\\Projects\\TopTrendù\\tmp/Cropped/sWlURhM5P5Q.mp4",
      },
      {
        id: "G08hY8dSrUY",
        name: "A.I. Versus The Law",
        time: 1236,
        channelName: "LegalEagle",
        position: 4,
        currentPath:
          "C:\\Users\\Leonardo\\Projects\\TopTrendù\\tmp/Cropped/G08hY8dSrUY.mp4",
      },
      {
        id: "_VYqksya-78",
        name: "Natalie Noel's 6 Month Body Transformation",
        time: 1648,
        channelName: "Xeela Fitness",
        position: 5,
        currentPath:
          "C:\\Users\\Leonardo\\Projects\\TopTrendù\\tmp/Cropped/_VYqksya-78.mp4",
      },
    ];
    // insert text here
    const textadded = await this.addText(cropped);
    const merged = await this.mergeVideos(textadded);
    // outro-intro here

    console.log(merged);
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
