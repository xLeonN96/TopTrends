import type { ApplicationContract } from "@ioc:Adonis/Core/Application";

export default class AppProvider {
  constructor(protected app: ApplicationContract) {}

  public register() {
    // Register your own bindings
  }

  public async boot() {
    // IoC container is ready
  }

  public async ready() {
    const YTBService = await import("App/Services/YTBService");
    const ytbservice = new YTBService.YTBService();
    this.app.container.singleton("App/Services/YTBService", () => {
      return ytbservice;
    });
    const CreateVideoService = await import("App/Services/CreateVideoService");
     const createvideoservice = new CreateVideoService.CreateVideoService();
     this.app.container.singleton("App/Services/CreateVideoService", () => {
      return createvideoservice;
    });
  }

  public async shutdown() {
    // Cleanup, since app is going down
  }
}
