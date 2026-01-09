import React, { useContext } from 'react';
import { useMutation } from '@apollo/client';
import { useIntl } from 'react-intl';
import ActionsList from './component';
import { layoutSelectInput, layoutDispatch, layoutSelect } from '../../layout/context';
import { SMALL_VIEWPORT_BREAKPOINT, ACTIONS, PANELS } from '../../layout/enums';
import {
  useIsCameraAsContentEnabled,
  useIsPresentationEnabled,
  useIsTimerFeatureEnabled,
} from '/imports/ui/services/features';
import { PluginsContext } from '/imports/ui/components/components-data/plugin-context/context';
import {
  PRESENTATIONS_SUBSCRIPTION,
} from '/imports/ui/components/whiteboard/queries';
import useDeduplicatedSubscription from '/imports/ui/core/hooks/useDeduplicatedSubscription';
import { SET_PRESENTER } from '/imports/ui/core/graphql/mutations/userMutations';
import { TIMER_ACTIVATE, TIMER_DEACTIVATE } from '../../timer/mutations';
import Auth from '/imports/ui/services/auth';
import { PRESENTATION_SET_CURRENT } from '../../presentation/mutations';
import { useStorageKey } from '/imports/ui/services/storage/hooks';
import { useMeetingIsBreakout } from '/imports/ui/components/app/service';
import useMeeting from '/imports/ui/core/hooks/useMeeting';
import PropTypes from 'prop-types';

const ActionsListContainer = (props) => {
  const sidebarContent = layoutSelectInput((i) => i.sidebarContent);
  const sidebarNavigation = layoutSelectInput((i) => i.sidebarNavigation);
  const { width: browserWidth } = layoutSelectInput((i) => i.browser);
  const isMobile = browserWidth <= SMALL_VIEWPORT_BREAKPOINT;
  const layoutContextDispatch = layoutDispatch();
  const isRTL = layoutSelect((i) => i.isRTL);
  const { pluginsExtensibleAreasAggregatedState } = useContext(PluginsContext);
  const meetingIsBreakout = useMeetingIsBreakout();

  let actionButtonDropdownItems = [];
  if (pluginsExtensibleAreasAggregatedState.actionButtonDropdownItems) {
    actionButtonDropdownItems = [
      ...pluginsExtensibleAreasAggregatedState.actionButtonDropdownItems,
    ];
  }

  const { data: presentationData } = useDeduplicatedSubscription(
    PRESENTATIONS_SUBSCRIPTION,
  );
  const presentations = presentationData?.pres_presentation || [];

  const {
    allowPresentationManagementInBreakouts,
  } = window.meetingClientSettings.public.app.breakouts;

  const isPresentationManagementDisabled = meetingIsBreakout
    && !allowPresentationManagementInBreakouts;

  const [setPresenter] = useMutation(SET_PRESENTER);
  const [timerActivate] = useMutation(TIMER_ACTIVATE);
  const [timerDeactivate] = useMutation(TIMER_DEACTIVATE);
  const [presentationSetCurrent] = useMutation(PRESENTATION_SET_CURRENT);

  const handleTakePresenter = () => {
    setPresenter({ variables: { userId: Auth.userID } });
  };

  const setPresentation = (presentationId) => {
    presentationSetCurrent({ variables: { presentationId } });
  };

  const activateTimer = () => {
    const TIMER_CONFIG = window.meetingClientSettings.public.timer;
    const MILLI_IN_MINUTE = 60000;
    const stopwatch = true;
    const running = false;
    const time = TIMER_CONFIG.time * MILLI_IN_MINUTE;

    timerActivate({ variables: { stopwatch, running, time } });

    setTimeout(() => {
      layoutContextDispatch({
        type: ACTIONS.SET_SIDEBAR_CONTENT_IS_OPEN,
        value: true,
      });
      layoutContextDispatch({
        type: ACTIONS.SET_SIDEBAR_CONTENT_PANEL,
        value: PANELS.TIMER,
      });
    }, 500);
  };

  const isPresentationEnabled = useIsPresentationEnabled();
  const isTimerFeatureEnabled = useIsTimerFeatureEnabled();
  const isCameraAsContentEnabled = useIsCameraAsContentEnabled();
  const intl = useIntl();

  // Lấy isTimerActive từ meeting data
  const { data: currentMeeting } = useMeeting((m) => ({
    componentsFlags: m.componentsFlags,
  }));
  const isTimerActive = currentMeeting?.componentsFlags?.hasTimer || false;

  return (
    <ActionsList
      {...{
        intl,
        layoutContextDispatch,
        sidebarContent,
        sidebarNavigation,
        isMobile,
        isRTL,
        actionButtonDropdownItems,
        presentations: presentations.filter((p) => p).filter((p) => p.uploadCompleted),
        isTimerFeatureEnabled,
        isTimerActive,
        isTimerEnabled: isTimerFeatureEnabled, // isTimerEnabled = isTimerFeatureEnabled
        isCameraAsContentEnabled,
        setPresentation,
        isPresentationEnabled,
        isPresentationManagementDisabled,
        handleTakePresenter,
        activateTimer,
        deactivateTimer: timerDeactivate,
        onOpenExternalVideoModal: props.onOpenExternalVideoModal,
        onOpenCameraAsContentModal: props.onOpenCameraAsContentModal,
        ...props,
      }}
    />
  );
};

  ActionsListContainer.propTypes = {
  onOpenExternalVideoModal: PropTypes.func,
  onOpenCameraAsContentModal: PropTypes.func,
};

ActionsListContainer.propTypes = {
  onOpenExternalVideoModal: PropTypes.func,
  onOpenCameraAsContentModal: PropTypes.func,
};

export default ActionsListContainer;
