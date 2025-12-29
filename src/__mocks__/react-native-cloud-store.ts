/**
 * Mock for react-native-cloud-store
 */

export const isICloudAvailable = jest.fn().mockResolvedValue(true);
export const getDefaultICloudContainerPath = jest.fn().mockResolvedValue('/mock/icloud/container');
export const writeFile = jest.fn().mockResolvedValue(undefined);
export const readFile = jest.fn().mockResolvedValue('[]');
export const exist = jest.fn().mockResolvedValue(false);
export const stat = jest.fn().mockResolvedValue({
  modifyTimestamp: Date.now(),
  isDirectory: false,
});
export const readDir = jest.fn().mockResolvedValue([]);
export const createDir = jest.fn().mockResolvedValue(undefined);
export const moveDir = jest.fn().mockResolvedValue(undefined);
export const copy = jest.fn().mockResolvedValue(undefined);
export const unlink = jest.fn().mockResolvedValue(undefined);

export const defaultICloudContainerPath = '/mock/icloud/container';

export enum DownloadStatus {
  current = 'NSURLUbiquitousItemDownloadingStatusCurrent',
  downloaded = 'NSURLUbiquitousItemDownloadingStatusDownloaded',
  notDownloaded = 'NSURLUbiquitousItemDownloadingStatusNotDownloaded',
}

export const evictUbiquitousItem = jest.fn().mockResolvedValue(undefined);
export const startDownloadingUbiquitousItem = jest.fn().mockResolvedValue(undefined);
export const setUbiquitous = jest.fn().mockResolvedValue(undefined);
export const getUrlForPublishingUbiquitousItem = jest.fn().mockResolvedValue('https://mock-url.com');
export const upload = jest.fn().mockResolvedValue(undefined);
export const download = jest.fn().mockResolvedValue(undefined);
export const registerGlobalUploadEvent = jest.fn().mockReturnValue({ remove: jest.fn() });
export const registerGlobalDownloadEvent = jest.fn().mockReturnValue({ remove: jest.fn() });
export const onICloudDocumentsStartGathering = jest.fn().mockReturnValue({ remove: jest.fn() });
export const onICloudDocumentsGathering = jest.fn().mockReturnValue({ remove: jest.fn() });
export const onICloudDocumentsFinishGathering = jest.fn().mockReturnValue({ remove: jest.fn() });
export const onICloudDocumentsUpdateGathering = jest.fn().mockReturnValue({ remove: jest.fn() });
export const registerICloudIdentityDidChangeEvent = jest.fn().mockReturnValue({ remove: jest.fn() });
export const onICloudIdentityDidChange = jest.fn().mockReturnValue({ remove: jest.fn() });

// KV Store
export const kvSync = jest.fn().mockResolvedValue(undefined);
export const kvSetItem = jest.fn().mockResolvedValue(undefined);
export const kvGetItem = jest.fn().mockResolvedValue(undefined);
export const kvRemoveItem = jest.fn().mockResolvedValue(undefined);
export const kvGetAllItems = jest.fn().mockResolvedValue({});

export enum KVStoreChangedReason {
  NSUbiquitousKeyValueStoreServerChange = 0,
  NSUbiquitousKeyValueStoreInitialSyncChange = 1,
  NSUbiquitousKeyValueStoreQuotaViolationChange = 2,
  NSUbiquitousKeyValueStoreAccountChange = 3,
}

export const registerKVStoreRemoteChangedEvent = jest.fn().mockReturnValue({ remove: jest.fn() });
export const onKVStoreRemoteChanged = jest.fn().mockReturnValue({ remove: jest.fn() });

// Path utilities
export const getICloudURL = jest.fn().mockResolvedValue('/mock/icloud/container');
