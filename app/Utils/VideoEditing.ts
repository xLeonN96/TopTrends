import { TEMP_FOLDER, VIDEO_FORMAT,TITLE_FOLDER } from "./../Config/settings";
import { makeid, secondsToFormat } from "./Generic";
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegPath);
const concat = require("ffmpeg-concat");
const canvas = require("canvas");
const fs = require("fs");
function resizingFFmpeg(
  video: string,
  width: number,
  height: number,
  tempFile: string,
  autoPad?: boolean,
  padColor?: string
): Promise<string> {
  return new Promise((res, rej) => {
    let ff = ffmpeg().input(video).size(`${width}x${height}`);
    autoPad ? (ff = ff.autoPad(autoPad, padColor)) : null;
    ff.output(tempFile)
      .on("start", function (commandLine) {
        console.log("Spawned FFmpeg with command: " + commandLine);
        console.log("Start resizingFFmpeg:", video);
      })
      // .on("progress", function(progress) {
      //   console.log(progress);
      // })
      .on("error", function (err) {
        console.log("Problem performing ffmpeg function");
        console.log(err);
        rej(err);
      })
      .on("end", function () {
        console.log("End resizingFFmpeg:", tempFile);
        res(tempFile);
      })
      .run();
  });
}

function videoCropCenterFFmpeg(
  video: string,
  w: number,
  h: number,
  tempFile: string
): Promise<string> {
  return new Promise((res, rej) => {
    ffmpeg()
      .input(video)
      .videoFilters([
        {
          filter: "crop",
          options: {
            w,
            h,
          },
        },
      ])
      .output(tempFile)
      .on("start", function (commandLine) {
        console.log("Spawned FFmpeg with command: " + commandLine);
        console.log("Start videoCropCenterFFmpeg:", video);
      })
      // .on("progress", function(progress) {
      //   console.log(progress);
      // })
      .on("error", function (err) {
        console.log("Problem performing ffmpeg function");
        rej(err);
      })
      .on("end", function () {
        console.log("End videoCropCenterFFmpeg:", tempFile);
        res(tempFile);
      })
      .run();
  });
}

function getDimentions(media: string) {
  console.log("Getting Dimentions from:", media);
  return new Promise<{ width: number; height: number }>((res, rej) => {
    ffmpeg.ffprobe(media, async function (err, metadata) {
      if (err) {
        console.log("Error occured while getting dimensions of:", media);
        rej(err);
      }
      res({
        width: metadata.streams[0].width,
        height: metadata.streams[0].height,
      });
    });
  });
}

export async function videoScale(
  video: string,
  output: string,
  newWidth: number,
  newHeight: number
) {
  const { width, height } = await getDimentions(video);
  if ((width / height).toFixed(2) > (newWidth / newHeight).toFixed(2)) {
    // y=0 case
    // landscape to potrait case
    const x = width - (newWidth / newHeight) * height;
    console.log(`New Intrim Res: ${width - x}x${height}`);
    const cropping = `${TEMP_FOLDER}/${makeid(5)}.${VIDEO_FORMAT}`;
    let cropped = await videoCropCenterFFmpeg(
      video,
      width - x,
      height,
      cropping
    );
    let resized = await resizingFFmpeg(cropped, newWidth, newHeight, output);
    // unlink temp cropping file
    // fs.unlink(cropping, (err) => {
    //   if (err) console.log(err);
    //   console.log(`Temp file ${cropping} deleted Successfuly...`);
    // });
    return resized;
  } else if ((width / height).toFixed(2) < (newWidth / newHeight).toFixed(2)) {
    // x=0 case
    // potrait to landscape case
    // calculate crop or resize with padding or blur sides
    // or just return with black bars on the side
    return await resizingFFmpeg(video, newWidth, newHeight, output, true);
  } else {
    console.log("Same Aspect Ratio forward for resizing");
    return await resizingFFmpeg(video, newWidth, newHeight, output);
  }
}

export function cutVideo(
  inputPath: string,
  outputPath: string,
  start: number,
  end: number
) {
  return new Promise((resolve, _) => {
    ffmpeg()
      .input(inputPath)
      .setStartTime(secondsToFormat(start))
      .setDuration(secondsToFormat(end - start))
      .output(outputPath)
      .on("end", () => {
        resolve(outputPath);
      })
      .run();
  });
}

export async function mergeClips(paths: string[], output: string) {
  await concat({
    output: output,
    videos: paths,
    transition: {
      name: "directionalWipe",
      duration: 100,
    },
  });
  return output;
}

export async function addTextOnVideo(
  inputPath: string,
  outputPath: string,
  videoName: string,
  channelName: string
): Promise<string> {
  return new Promise((resolve, _) => {
    const words = videoName.split(" ");
    const rows: string[] = [];
    let row = "";

    words.forEach((word) => {
      row += word + " ";

      if (row.length > 18) {
        rows.push(row);
        row = "";
      }
    });

    // Create a new canvas
    const image = canvas.createCanvas(640, 480);
    const ctx = image.getContext("2d");
    // set the canvas background to transparent
    ctx.clearRect(0, 0, image.width, image.height);

    // Set the font and fill style for the text
    ctx.font = `80px 'Chalkduster'`;
    ctx.fillStyle = "yellow";

    // Add the text to the canvas
    ctx.fillText(channelName,20, 250);

    // Save the canvas image to a file
    const buffer = image.toBuffer("image/png");
    const overlaypath = TITLE_FOLDER+"/"+makeid(6)+".png";
    fs.writeFileSync(overlaypath, buffer);
    
    const inputVideo = inputPath;
    const imageOverlay = overlaypath;
    const outputVideo = outputPath;

    ffmpeg()
      .input(inputVideo)
      .input(imageOverlay)
      .complexFilter(["overlay=0:0:enable='between(t,0,30)'"])
      .output(outputVideo)
      .on("end", function () {
        console.log("Video overlay complete!");
        resolve(outputPath);
      })
      .on("error", function (err) {
        console.log("An error occurred: " + err.message);
      })
      .run();

    // const command = ffmpeg(inputPath).videoFilters(
    //   `drawtext=text='${channelName.toUpperCase()}': font='Oswald': fontsize=100: fontcolor=yellow: x=10: y=400`
    // );
    // rows.forEach((row, key) => {
    //   command.videoFilters(
    //     `drawtext=text='${row}':  fontfile='Oswald.ttf': fontsize=60: fontcolor=white: x=10: y=${
    //       520 + key * 60
    //     }`
    //   );
    // });
    // command
    //   .save(outputPath)
    //   .on("end", () => {
    //     resolve(outputPath);
    //   })
    //   .run();
  });
}
