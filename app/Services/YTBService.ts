import Env from "@ioc:Adonis/Core/Env";
import axios from "axios";
import Application from "@ioc:Adonis/Core/Application";
const fs = require("fs");
const ytdl = require("ytdl-core");
export class YTBService {
  async getTopTrends(entries: number) {
    const response = await axios.get(
      "https://www.googleapis.com/youtube/v3/videos?chart=mostPopular&regionCode=US&part=snippet&maxResults=" +
        entries +
        "&key=" +
        Env.get("GOOGLE_API_KEY")
    );
    return response.data;
  }

  async getDuration(id: string) {
    const response = await axios.get(
      "https://www.googleapis.com/youtube/v3/videos?id=" +
        id +
        "&part=contentDetails" +
        "&key=" +
        Env.get("GOOGLE_API_KEY")
    );
    return response.data;
  }

  async download(id: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const video = ytdl("https://www.youtube.com/watch?v=" + id, {
          filter: (format) => format.container === "mp4",
        });
        const path=Application.tmpPath() + "/Download/" + id + ".mp4"
        video.pipe(
          fs.createWriteStream(path)
        );
        video.on("end", () => {
          resolve(path);
        });
      } catch (err) {
        reject(err);
      }
    });
  }
}
