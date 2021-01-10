declare module 'meteor/unchained:core-worker' {
  type DoWorkReturn<Result> = {
    success: boolean;
    result: Result;
  };

  class WorkerPlugin<Arg, Result> {
    doWork(arg: Arg): Promise<DoWorkReturn<Result>>;
  }

  class WorkerDirector {
    static registerPlugin<Arg, Result>(plugin: WorkerPlugin<Arg, Result>): void;
  }

  export { WorkerDirector, WorkerPlugin, DoWorkReturn };
}
