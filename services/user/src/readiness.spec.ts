import { ConfigService } from "@nestjs/config";
import { MongoService } from "./mongo/mongo.service";

const mockConnect = jest.fn();
const mockCommand = jest.fn();
jest.mock("mongodb", () => ({
  MongoClient: jest.fn().mockImplementation(() => ({
    connect: mockConnect,
    db: () => ({
      command: mockCommand,
      collection: () => ({ createIndexes: jest.fn().mockResolvedValue([]) }),
    }),
    close: jest.fn(),
  })),
}));

it("recovers when MongoDB becomes available after the first probe failed", async () => {
  let connected = false;
  mockConnect.mockRejectedValueOnce(new Error("database unavailable"));
  mockConnect.mockImplementation(async () => {
    connected = true;
  });
  mockCommand.mockImplementation(async () => {
    if (!connected) throw new Error("Topology is closed");
    return { ok: 1, isWritablePrimary: true, setName: "kinvue-users" };
  });
  const readiness = new MongoService(
    new ConfigService({ USERS_MONGO_URL: "mongodb://localhost/kinvue_test" }),
  );

  await expect(readiness.check()).rejects.toThrow();
  await expect(readiness.check()).resolves.toBeUndefined();
  expect(mockConnect).toHaveBeenCalledTimes(2);
  expect(mockCommand).toHaveBeenCalledTimes(1);
});
