import Application from "@ioc:Adonis/Core/Application";
import * as fsExtra from "fs-extra";
const fs = require("fs");
const { google } = require("googleapis");
const readline = require("readline");
const OAuth2 = google.auth.OAuth2;
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
  projectDirectory,
} from "./../Config/settings";
import ytbservice from "@ioc:App/Services/YTBService";
import {
  addTextOnVideo,
  cutVideo,
  mergeClips,
  videoScale,
} from "App/Utils/VideoEditing";

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
    // let videos: video[] = [];

    // this.clearFolders();

    // videos = await this.getTrends();
    // videos = await this.downloadVideos(videos);
    // videos = this.getValidVideos(videos);
    // videos = this.getSlicedVideos(videos);
    // videos = await this.clipVideos(videos);
    // videos = await this.cropVideos(videos);
    // videos = await this.addText(videos);
    // videos = this.addIntro(videos);
    // const merged = await this.mergeVideos(videos);
    // console.log(merged);
    await this.uploadVideo();
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
      data.map(async (video, key) => {
        try {
          console.log("Start Adding Text", video.id);
          video.currentPath = await addTextOnVideo(
            video.currentPath!,
            `${TITLE_FOLDER}/${video.id}.${VIDEO_FORMAT}`,
            video.name,
            video.channelName,
            key + 1
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

  async uploadVideo() {
    // If modifying these scopes, delete your previously saved credentials
    // at ~/.credentials/upload_app_session.json
    const SCOPES = [
      "https://www.googleapis.com/auth/youtube.upload",
      "https://www.googleapis.com/auth/youtube.readonly",
    ];
    const TOKEN_DIR =
      (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) +
      "/.credentials/";
    const TOKEN_PATH =   projectDirectory+"/client_secret.json";

    const authorize = (credentials, cb) => {
      const clientSecret = credentials.installed.client_secret;
      const clientId = credentials.installed.client_id;
      const redirectUrl = credentials.installed.redirect_uris[0];
      const oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);

      // Check if we have previously stored a token.
      fs.readFile(TOKEN_PATH, (error, token) => {
        if (error) {
          return getNewToken(oauth2Client, cb);
        } else {
          oauth2Client.credentials = JSON.parse(token);
          return cb(null, oauth2Client);
        }
      });
    };

    const getNewToken = (oauth2Client, cb) => {
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: SCOPES,
      });
      console.log("Authorize this app by visiting this url: ", authUrl);
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      rl.question("Enter the code from that page here: ", (code) => {
        rl.close();
        oauth2Client.getToken(code, (error, token) => {
          if (error) {
            return cb(
              new Error("Error while trying to retrieve access token", error)
            );
          }
          oauth2Client.credentials = token;
          storeToken(token);
          return cb(null, oauth2Client);
        });
      });
    };

    const storeToken = (token) => {
      try {
        fs.mkdirSync(TOKEN_DIR);
      } catch (error) {
        if (error.code != "EEXIST") {
          throw error;
        }
      }
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (error) => {
        if (error) throw error;
        console.log("Token stored to " + TOKEN_PATH);
      });
    };

    module.exports = { authorize };

    fs.readFile("client_secret.json", (error, content) => {
      if (error) {
        console.log("Error loading client secret file: " + error);
        return cb(error);
      }
      // Authorize a client with the loaded credentials
      authorize(JSON.parse(content), cb);
    });

    const { google } = require("googleapis");
    const service = google.youtube("v3");
    const fs = require("fs");

    const uploadVideo = (auth, cb) => {
      service.videos.insert(
        {
          auth: auth,
          part: "snippet,contentDetails,status",
          resource: {
            // Video title and description
            snippet: {
              title: "My title",
              description: "My description",
            },
            // I set to private for tests
            status: {
              privacyStatus: "private",
            },
          },

          // Create the readable stream to upload the video
          media: {
            body: fs.createReadStream("video.flv"), // Change here to your real video
          },
        },
        (error, data) => {
          if (error) {
            return cb(error);
          }
          console.log("https://www.youtube.com/watch?v=" + data.data.id);
          return cb(null, data.data.id);
        }
      );
    };

    module.exports = { uploadVideo };
  }
}
