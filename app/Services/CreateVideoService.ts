import ytbservice from "@ioc:App/Services/YTBService";

const cron = require("node-cron");
export class CreateVideoService {
  constructor() {
    cron.schedule("*/10 * * * * *", async () => {
      console.log("Start");
    //   const trends = await ytbservice.getTopTrends(5);
    //   const data = trends.items.map((e) => {
    //     return {
    //       name: e.snippet.title,
    //       id: e.id,
    //     };
    //   });
    //   console.log(data); 
      const path = await  ytbservice.download("tPEE9ZwTmy0");
      console.log(path);
    });
  }
}
