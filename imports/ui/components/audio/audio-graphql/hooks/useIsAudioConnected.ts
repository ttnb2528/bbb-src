/* eslint-disable no-underscore-dangle */
import { useReactiveVar } from '@apollo/client';
import AudioManager from '/imports/ui/services/audio-manager';

export const useIsAudioConnected = ({ ignoreDeafened = false } = {}): boolean => {
  // Add null checks to prevent errors if AudioManager is not fully initialized
  // @ts-ignore
  const isConnectedVar = AudioManager._isConnected?.value;
  // @ts-ignore
  const isDeafenedVar = AudioManager._isDeafened?.value;
  
  // If reactive variables are not available, return false
  if (!isConnectedVar || !isDeafenedVar) {
    return false;
  }
  
  const isConnected = useReactiveVar(isConnectedVar) as boolean;
  const isDeafened = useReactiveVar(isDeafenedVar) as boolean;

  return isConnected && (!isDeafened || ignoreDeafened);
};

export default useIsAudioConnected;
