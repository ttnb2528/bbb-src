import { StreamItem, VideoItem } from './types';
import UserListService from '/imports/ui/components/user-list/service';
import Auth from '/imports/ui/services/auth';
import VideoService from './service';
import { VIDEO_TYPES } from './enums';

const DEFAULT_SORTING_MODE = 'LOCAL_ALPHABETICAL';

// pin first, ignore connecting streams
export const sortPin = (s1: any, s2: any) => {
  if (s1.type === VIDEO_TYPES.CONNECTING) {
    return 0;
  }
  if (s2.type === VIDEO_TYPES.CONNECTING) {
    return 0;
  }
  const isS1Spotlighted = s1.user?.isSpotlighted || (s1 as any).isSpotlighted;
  const isS2Spotlighted = s2.user?.isSpotlighted || (s2 as any).isSpotlighted;

  if (isS1Spotlighted && !isS2Spotlighted) {
    return -1;
  } if (isS2Spotlighted && !isS1Spotlighted) {
    return 1;
  }

  const isS1Pinned = s1.user?.pinned || (s1 as any).pinned;
  const isS2Pinned = s2.user?.pinned || (s2 as any).pinned;

  if (isS1Pinned && !isS2Pinned) {
    return -1;
  } if (isS2Pinned && !isS1Pinned) {
    return 1;
  }
  return 0;
};

export const mandatorySorting = (s1: any, s2: any) => sortPin(s1, s2);

// lastFloorTime (descending), ignore connecting streams
export const sortVoiceActivity = (s1: any, s2: any) => {
  if (s1.type === VIDEO_TYPES.CONNECTING) {
    return 0;
  }
  if (s2.type === VIDEO_TYPES.CONNECTING) {
    return 0;
  }
  if (s2.lastFloorTime < s1.lastFloorTime) {
    return -1;
  }
  if (s2.lastFloorTime > s1.lastFloorTime) {
    return 1;
  }
  return 0;
};

// pin -> lastFloorTime (descending) -> alphabetical -> local
export const sortVoiceActivityLocal = (s1: any, s2: any) => {
  if (s1.userId === Auth.userID) {
    return 1;
  } if (s2.userId === Auth.userID) {
    return -1;
  }

  return mandatorySorting(s1, s2)
    || sortVoiceActivity(s1, s2)
    || UserListService.sortUsersByName(s1, s2);
};

export const sortByLocal = (s1: any, s2: any) => {
  if (VideoService.isLocalStream(s1.stream)) {
    return -1;
  } if (VideoService.isLocalStream(s2.stream)) {
    return 1;
  }

  return 0;
};

// pin -> local -> lastFloorTime (descending) -> alphabetical
export const sortLocalVoiceActivity = (s1: any, s2: any) => mandatorySorting(s1, s2)
    || sortByLocal(s1, s2)
    || sortVoiceActivity(s1, s2)
    || UserListService.sortUsersByName(s1, s2);

// pin -> local -> alphabetic
export const sortLocalAlphabetical = (s1: any, s2: any) => mandatorySorting(s1, s2)
    || sortByLocal(s1, s2)
    || UserListService.sortUsersByName(s1, s2);

export const sortPresenter = (s1: any, s2: any) => {
  if (s1.type === VIDEO_TYPES.STREAM && s1.user.presenter) {
    return -1;
  }
  if (s2.type === VIDEO_TYPES.STREAM && s2.user.presenter) {
    return 1;
  }
  return 0;
};

// pin -> local -> presenter -> alphabetical
export const sortLocalPresenterAlphabetical = (s1: any, s2: any) => mandatorySorting(s1, s2)
    || sortByLocal(s1, s2)
    || sortPresenter(s1, s2)
    || UserListService.sortUsersByName(s1, s2);

const SORTING_METHODS = Object.freeze({
  // Default
  LOCAL_ALPHABETICAL: {
    sortingMethod: sortLocalAlphabetical,
    localFirst: true,
  },
  VOICE_ACTIVITY_LOCAL: {
    sortingMethod: sortVoiceActivityLocal,
    localFirst: false,
  },
  LOCAL_VOICE_ACTIVITY: {
    sortingMethod: sortLocalVoiceActivity,
    localFirst: true,
  },
  LOCAL_PRESENTER_ALPHABETICAL: {
    sortingMethod: sortLocalPresenterAlphabetical,
    localFirst: true,
  },
});

export const getSortingMethod = (identifier: string) => {
  return SORTING_METHODS[identifier as keyof typeof SORTING_METHODS] || SORTING_METHODS[DEFAULT_SORTING_MODE];
};

export const sortVideoStreams = (streams: any[], mode: string) => {
  const { sortingMethod } = getSortingMethod(mode);
  const sorted = streams.sort(sortingMethod);
  return sorted;
};
