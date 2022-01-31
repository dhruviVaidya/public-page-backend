import { LoggingBunyan, LOGGING_TRACE_KEY } from "@google-cloud/logging-bunyan";
import * as bunyan from "bunyan";
import * as httpContext from "express-http-context";
import * as path from "path";
const PROJECT_ROOT = path.join(__dirname, "..");
let projectId: string;
if (process.env.NODE_ENV === "staging") {
  projectId = "trenchaant-staging";
} else if (process.env.NODE_ENV === "production") {
  projectId = "trenchaant-staging";
} else if (process.env.NODE_ENV === "development") {
  projectId = "tasktool-238217";
} else {
  projectId = "tasktool-238217";
}
const showFileAndLine = process.env.NODE_ENV !== "production";
console.log(`Show file & line => ${showFileAndLine}`);
let logger = undefined;
function getLogger() {
  if (!logger) {
    let loggerOption;
    if (!process.env.NODE_ENV || process.env.NODE_ENV === "dev") {
      const bunyanDebugStream = require("bunyan-debug-stream"); // eslint-disable-line
      loggerOption = {
        name: "default",
        streams: [
          {
            level: "info",
            type: "raw",
            stream: bunyanDebugStream({
              forceColor: true,
            }),
          },
        ],
        serializers: bunyanDebugStream.serializers,
      };
    } else {
      const loggingBunyan = new LoggingBunyan({
        projectId,
        // keyFilename: `./dist/config/${keyFilename}`,
        autoRetry: true,
        maxRetries: 5,
      });
      loggerOption = {
        name: projectId,
        streams: [loggingBunyan.stream("info")],
      };
    }
    // Create a Bunyan logger that streams to Stackdriver Logging
    logger = bunyan.createLogger(loggerOption);
    logger.on("error", function (err) {
      logger = undefined;
    });
  }
  return logger;
}
function getTraceId() {
  if (!httpContext.get("traceId")) return "";
  return `projects/${projectId}/traces/${httpContext.get("traceId")}`;
}
function getMeta() {
  if (!getTraceId()) return {};
  return {
    [LOGGING_TRACE_KEY]: getTraceId(),
  };
}
const infoLogs: { [key: string]: any } = {};
const errorLogs: { [key: string]: any } = {};
export const log = {
  end: () => {
    if (
      getLogger().streams.length === 0 ||
      typeof getLogger().streams[0] !== "object"
    )
      return;
    // close stream, flush buffer to disk
    getLogger().streams[0].stream.end();
  },
  log: (level: string, message: any) => {
    if (message instanceof Object) {
      message = JSON.stringify(message);
    }
    getLogger().log(
      level,
      showFileAndLine ? formatLogArguments(message) : message,
      getMeta()
    );
  },
  error(message: any) {
    if (message instanceof Error) {
      if (message.stack) {
        getLogger().error(
          getMeta(),
          showFileAndLine ? formatLogArguments([message.stack]) : message.stack
        );
      } else {
        getLogger().error(
          getMeta(),
          showFileAndLine
            ? formatLogArguments([message.message])
            : message.message
        );
      }
    } else {
      if (message instanceof Object) {
        message = JSON.stringify(message);
      }
      getLogger().error(
        getMeta(),
        showFileAndLine ? formatLogArguments(message) : message
      );
    }
  },
  pushError(message: any) {
    const traceId = getTraceId();
    errorLogs[traceId] = errorLogs[traceId] || [];
    errorLogs[traceId].push(
      showFileAndLine ? formatLogArguments(message) : message
    );
  },
  flushError() {
    const traceId = getTraceId();
    if (errorLogs[traceId] && errorLogs[traceId].length) {
      log.error(errorLogs[traceId]);
    }
    delete errorLogs[traceId];
  },
  warn(message: any) {
    if (message instanceof Error) {
      if (message.stack) {
        getLogger().error(
          getMeta(),
          showFileAndLine ? formatLogArguments([message.stack]) : message.stack
        );
      } else {
        getLogger().warn(
          getMeta(),
          showFileAndLine
            ? formatLogArguments([message.message])
            : message.message
        );
      }
    } else {
      if (message instanceof Object) {
        message = JSON.stringify(message);
      }
      getLogger().warn(
        getMeta(),
        showFileAndLine ? formatLogArguments(message) : message
      );
    }
  },
  verbose(message: any) {
    if (message instanceof Object) {
      message = JSON.stringify(message);
    }
    getLogger().verbose(
      getMeta(),
      showFileAndLine ? formatLogArguments(message) : message
    );
  },
  info(message: any, showFileAndLineOverride: boolean = true) {
    if (message instanceof Object) {
      message = JSON.stringify(message);
    }
    getLogger().info(
      getMeta(),
      showFileAndLineOverride && showFileAndLine
        ? formatLogArguments(message)
        : message
    );
  },
  pushInfo(message: any) {
    const traceId = getTraceId();
    infoLogs[traceId] = infoLogs[traceId] || [];
    infoLogs[traceId].push(
      showFileAndLine ? formatLogArguments(message) : message
    );
  },
  flushInfo() {
    const traceId = getTraceId();
    if (infoLogs[traceId] && infoLogs[traceId].length) {
      log.info(infoLogs[traceId], false);
    }
    delete infoLogs[traceId];
  },
  debug(message: any) {
    if (message instanceof Object) {
      message = JSON.stringify(message);
    }
    getLogger().debug(
      getMeta(),
      showFileAndLine ? formatLogArguments(message) : message
    );
  },
  silly(message: any) {
    if (message instanceof Object) {
      message = JSON.stringify(message);
    }
    getLogger().silly(
      getMeta(),
      showFileAndLine ? formatLogArguments(message) : message
    );
  },
};
function formatLogArguments(message: any) {
  const stackInfo = getStackInfo(1);
  if (stackInfo) {
    // get file path relative to project root
    const calleeStr = "(" + stackInfo.relativePath + ":" + stackInfo.line + ")";
    if (typeof message === "string") {
      message = calleeStr + " " + message;
    } else {
      message = [calleeStr, message];
    }
  }
  return message;
}
function getStackInfo(stackIndex: number) {
  // get call stack, and analyze it
  // get all file, method, and line numbers
  const stacklist = new Error().stack.split("\n").slice(3);
  // stack trace format:
  // http://code.google.com/p/v8/wiki/JavaScriptStackTraceApi
  // do not remove the regex expresses to outside of this method (due to a BUG in node.js)
  const stackReg = /at\s+(.*)\s+\((.*):(\d*):(\d*)\)/gi;
  const stackReg2 = /at\s+()(.*):(\d*):(\d*)/gi;
  const s = stacklist[stackIndex] || stacklist[0];
  const sp = stackReg.exec(s) || stackReg2.exec(s);
  if (sp && sp.length === 5) {
    return {
      method: sp[1],
      relativePath: path.relative(PROJECT_ROOT, sp[2]),
      line: sp[3],
      pos: sp[4],
      file: path.basename(sp[2]),
      stack: stacklist.join("\n"),
    };
  }
  return undefined;
}
