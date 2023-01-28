import { REGION_CODE, VIDEO_FORMAT } from "./../Config/settings";
import { DOWNLOAD_FOLDER } from "../Config/settings";
import Env from "@ioc:Adonis/Core/Env";
import axios from "axios";

const fs = require("fs");
import ytdl from "ytdl-core";
import { ISO8601ToSeconds } from "App/Utils/Generic";

export class YTBService {
  async getTopTrends(entries: number) {
    const response = await axios.get(
      `https://www.googleapis.com/youtube/v3/videos?chart=mostPopular&regionCode=${REGION_CODE}&part=snippet&maxResults=${entries}&key=${Env.get(
        "GOOGLE_API_KEY"
      )}`
    );
    return response.data;
  }

  async getDuration(id: string): Promise<number> {
    const response = await axios.get(
      `https://www.googleapis.com/youtube/v3/videos?id=${id}&part=contentDetails&key=${Env.get(
        "GOOGLE_API_KEY"
      )}`
    );

    const time = ISO8601ToSeconds(
      response.data.items[0].contentDetails.duration
    );

    return time;
  }

  async download(id: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const video = ytdl(`https://www.youtube.com/watch?v=${id}`, {
        filter: (format) => format.container === VIDEO_FORMAT,
      });

      const path = `${DOWNLOAD_FOLDER}/${id}.${VIDEO_FORMAT}`;
      video.pipe(fs.createWriteStream(path));

      video.on("error", (err) => {
        reject(err);
      });

      video.on("end", () => {
        resolve(path);
      });
    });
  }



}