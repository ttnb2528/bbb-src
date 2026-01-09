import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { defineMessages, injectIntl } from 'react-intl';
import Icon from '/imports/ui/components/common/icon/icon-ts/component';
import Styled from './styles';
import { colorPrimary } from '/imports/ui/stylesheets/styled-components/palette';
import { PANELS, ACTIONS } from '../../layout/enums';
import { layoutDispatch } from '../../layout/context';
import { uniqueId } from '/imports/utils/string-utils';
import { screenshareHasEnded } from '/imports/ui/components/screenshare/service';
import Session from '/imports/ui/services/storage/in-memory';
import ExternalVideoModal from '/imports/ui/components/external-video-player/external-video-player-graphql/modal/component';
import LayoutModalContainer from '/imports/ui/components/layout/modal/container';
import VideoPreviewContainer from '/imports/ui/components/video-preview/container';
import { ActionButtonDropdownItemType } from 'bigbluebutton-html-plugin-sdk/dist/cjs/extensible-areas/action-button-dropdown-item/enums';

const intlMessages = defineMessages({
  presentationLabel: {
    id: 'app.actionsBar.actionsDropdown.presentationLabel',
    description: 'Upload a presentation option label',
  },
  activateTimerStopwatchLabel: {
    id: 'app.actionsBar.actionsDropdown.activateTimerStopwatchLabel',
    description: 'Activate timer/stopwatch label',
  },
  deactivateTimerStopwatchLabel: {
    id: 'app.actionsBar.actionsDropdown.deactivateTimerStopwatchLabel',
    description: 'Deactivate timer/stopwatch label',
  },
  takePresenter: {
    id: 'app.actionsBar.actionsDropdown.takePresenter',
    description: 'Label for take presenter role option',
  },
  startExternalVideoLabel: {
    id: 'app.actionsBar.actionsDropdown.shareExternalVideo',
    description: 'Start sharing external video button',
  },
  stopExternalVideoLabel: {
    id: 'app.actionsBar.actionsDropdown.stopShareExternalVideo',
    description: 'Stop sharing external video button',
  },
  shareCameraAsContent: {
    id: 'app.actionsBar.actionsDropdown.shareCameraAsContent',
    description: 'Label for share camera as content',
  },
  unshareCameraAsContent: {
    id: 'app.actionsBar.actionsDropdown.unshareCameraAsContent',
    description: 'Label for unshare camera as content',
  },
});

const handlePresentationClick = () => Session.setItem('showUploadPresentationView', true);

class ActionsList extends PureComponent {
  constructor(props) {
    super(props);
    this.presentationItemId = uniqueId('action-item-');
    this.pollId = uniqueId('action-item-');
    this.takePresenterId = uniqueId('action-item-');
    this.timerId = uniqueId('action-item-');
    this.state = {
      isExternalVideoModalOpen: false,
      isLayoutModalOpen: false,
      isCameraAsContentModalOpen: false,
      propsToPassModal: {},
    };
    this.handleExternalVideoClick = this.handleExternalVideoClick.bind(this);
    this.setExternalVideoModalIsOpen = this.setExternalVideoModalIsOpen.bind(this);
    this.setLayoutModalIsOpen = this.setLayoutModalIsOpen.bind(this);
    this.setCameraAsContentModalIsOpen = this.setCameraAsContentModalIsOpen.bind(this);
    this.setPropsToPassModal = this.setPropsToPassModal.bind(this);
    this.handleTimerClick = this.handleTimerClick.bind(this);
  }

  handleExternalVideoClick() {
    this.setExternalVideoModalIsOpen(true);
  }

  handleTimerClick() {
    const {
      isTimerActive,
      activateTimer,
      deactivateTimer,
      layoutContextDispatch,
    } = this.props;

    if (isTimerActive) {
      deactivateTimer();
    } else {
      activateTimer();
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
    }
  }

  getAvailableActions() {
    const {
      intl,
      amIPresenter,
      amIModerator,
      isPresentationEnabled,
      isPresentationManagementDisabled,
      presentations,
      isSharingVideo,
      stopExternalVideoShare,
      allowExternalVideo,
      isTimerActive,
      isTimerEnabled,
      isTimerFeatureEnabled,
      hasCameraAsContent,
      isCameraAsContentEnabled,
      actionButtonDropdownItems,
      setPresentation,
      setPresentationFitToWidth,
      handleTakePresenter,
    } = this.props;

    const {
      presentationLabel,
      activateTimerStopwatchLabel,
      deactivateTimerStopwatchLabel,
      takePresenter,
      startExternalVideoLabel,
      stopExternalVideoLabel,
      shareCameraAsContent,
      unshareCameraAsContent,
    } = intlMessages;

    const { formatMessage } = intl;
    const actions = [];

    // Presentation items
    if (amIPresenter && !isPresentationManagementDisabled && isPresentationEnabled) {
      if (presentations && presentations.length > 1) {
        actions.push({
          key: 'separator-presentations',
          isSeparator: true,
        });
      }
      actions.push({
        icon: 'upload',
        dataTest: 'managePresentations',
        label: formatMessage(presentationLabel),
        key: this.presentationItemId,
        onClick: handlePresentationClick,
      });

      // Add presentation list if multiple presentations
      if (presentations && presentations.length > 1) {
        presentations
          .sort((a, b) => a.name.localeCompare(b.name))
          .forEach((p) => {
            actions.push({
              icon: 'file',
              iconRight: p.current ? 'check' : null,
              label: p.name,
              description: 'uploaded presentation file',
              key: `uploaded-presentation-${p.presentationId}`,
              onClick: () => {
                setPresentationFitToWidth(false);
                setPresentation(p.presentationId);
              },
              customStyles: p.current ? { color: colorPrimary } : null,
            });
          });
      }
    }

    // Take Presenter
    if (!amIPresenter && amIModerator) {
      actions.push({
        icon: 'presentation',
        label: formatMessage(takePresenter),
        key: this.takePresenterId,
        onClick: () => handleTakePresenter(),
      });
    }

    // External Video
    if (amIPresenter && allowExternalVideo) {
      const { onOpenExternalVideoModal } = this.props;
      actions.push({
        icon: !isSharingVideo ? 'external-video' : 'external-video_off',
        label: !isSharingVideo
          ? formatMessage(startExternalVideoLabel)
          : formatMessage(stopExternalVideoLabel),
        key: 'external-video',
        onClick: isSharingVideo 
          ? () => {
            if (stopExternalVideoShare) stopExternalVideoShare();
          }
          : () => {
            // Nếu có callback từ parent, dùng nó; nếu không dùng local state
            if (onOpenExternalVideoModal) {
              onOpenExternalVideoModal();
            } else {
              this.handleExternalVideoClick();
            }
          },
        dataTest: 'shareExternalVideo',
      });
    }

    // Timer
    if (amIModerator && isTimerEnabled && isTimerFeatureEnabled) {
      actions.push({
        icon: 'time',
        label: isTimerActive
          ? formatMessage(deactivateTimerStopwatchLabel)
          : formatMessage(activateTimerStopwatchLabel),
        key: this.timerId,
        onClick: () => this.handleTimerClick(),
        dataTest: 'timerStopWatchFeature',
      });
    }

    // Camera as Content
    if (isCameraAsContentEnabled && amIPresenter) {
      const { onOpenCameraAsContentModal } = this.props;
      actions.push({
        icon: hasCameraAsContent ? 'video_off' : 'video',
        label: hasCameraAsContent
          ? formatMessage(unshareCameraAsContent)
          : formatMessage(shareCameraAsContent),
        key: 'camera as content',
        onClick: hasCameraAsContent
          ? () => {
            // Unshare: dừng camera as content
            screenshareHasEnded();
          }
          : () => {
            // Share: mở modal để chọn camera
            // Nếu có callback từ parent, dùng nó; nếu không dùng local state
            if (onOpenCameraAsContentModal) {
              onOpenCameraAsContentModal();
            } else {
              this.setCameraAsContentModalIsOpen(true);
            }
          },
        dataTest: 'shareCameraAsContent',
      });
    }

    // Plugin actions
    actionButtonDropdownItems.forEach((actionButtonItem) => {
      switch (actionButtonItem.type) {
        case ActionButtonDropdownItemType.OPTION:
          actions.push({
            icon: actionButtonItem.icon,
            label: actionButtonItem.label,
            key: actionButtonItem.id,
            onClick: actionButtonItem.onClick,
            allowed: actionButtonItem.allowed,
            dataTest: actionButtonItem.dataTest,
          });
          break;
        case ActionButtonDropdownItemType.SEPARATOR:
          actions.push({
            key: actionButtonItem.id,
            allowed: actionButtonItem.allowed,
            isSeparator: true,
            dataTest: actionButtonItem.dataTest,
          });
          break;
        default:
          break;
      }
    });

    return actions;
  }

  setExternalVideoModalIsOpen(value) {
    this.setState({ isExternalVideoModalOpen: value });
  }

  setLayoutModalIsOpen(value) {
    this.setState({ isLayoutModalOpen: value });
  }

  setCameraAsContentModalIsOpen(value) {
    this.setState({ isCameraAsContentModalIsOpen: value });
  }

  setPropsToPassModal(value) {
    this.setState({ propsToPassModal: value });
  }

  renderModal(isOpen, setIsOpen, priority, Component) {
    const { onClose } = this.props;
    return isOpen ? (
      <Component
        {...{
          onRequestClose: () => {
            setIsOpen(false);
            // Đóng drawer khi modal đóng
            if (onClose) {
              onClose();
            }
          },
          priority,
          setIsOpen,
          isOpen,
        }}
      />
    ) : null;
  }

  render() {
    const {
      onClose,
    } = this.props;

    const availableActions = this.getAvailableActions();
    const {
      isExternalVideoModalOpen,
      isLayoutModalOpen,
      isCameraAsContentModalOpen,
      propsToPassModal,
    } = this.state;

    if (availableActions.length === 0) {
      return (
        <Styled.EmptyState>
          No actions available
        </Styled.EmptyState>
      );
    }

    return (
      <>
        <Styled.ActionsList>
          {availableActions.map((action) => {
            if (action.isSeparator) {
              return <Styled.Separator key={action.key} />;
            }

            if (action.allowed === false) {
              return null;
            }

            // Xác định xem action này có mở modal không
            const isModalAction = action.key === 'external-video' || action.key === 'camera as content';
            const { onOpenExternalVideoModal, onOpenCameraAsContentModal } = this.props;
            // Nếu có callback từ parent, modal được render ở level cao hơn, đóng drawer ngay
            const useParentModal = (action.key === 'external-video' && onOpenExternalVideoModal) 
              || (action.key === 'camera as content' && onOpenCameraAsContentModal);
            
            return (
              <Styled.ActionItem
                key={action.key}
                onClick={() => {
                  if (action.onClick) {
                    action.onClick();
                  }
                  // Nếu modal được render ở parent level, đóng drawer ngay
                  // Nếu modal render trong component này, không đóng drawer
                  if (onClose) {
                    if (useParentModal) {
                      // Modal ở parent, đóng drawer ngay
                      onClose();
                    } else if (!isModalAction) {
                      // Không phải modal action, đóng drawer
                      onClose();
                    }
                    // Nếu là modal action và không có parent callback, giữ drawer mở
                  }
                }}
                data-test={action.dataTest}
              >
                <Styled.ActionIcon>
                  <Icon iconName={action.icon} />
                </Styled.ActionIcon>
                <Styled.ActionContent>
                  <Styled.ActionLabel>{action.label}</Styled.ActionLabel>
                  {action.description && (
                    <Styled.ActionDescription>{action.description}</Styled.ActionDescription>
                  )}
                </Styled.ActionContent>
              </Styled.ActionItem>
            );
          })}
        </Styled.ActionsList>

        {this.renderModal(
          isExternalVideoModalOpen,
          this.setExternalVideoModalIsOpen,
          'low',
          ExternalVideoModal,
        )}
        {this.renderModal(
          isLayoutModalOpen,
          this.setLayoutModalIsOpen,
          'low',
          LayoutModalContainer,
        )}
        {this.renderModal(
          isCameraAsContentModalOpen,
          this.setCameraAsContentModalIsOpen,
          'low',
          () => (
            <VideoPreviewContainer
              cameraAsContent
              amIPresenter
              {...{
                callbackToClose: () => {
                  this.setPropsToPassModal({});
                },
                priority: 'low',
                setIsOpen: this.setCameraAsContentModalIsOpen,
                isOpen: isCameraAsContentModalOpen,
              }}
              {...propsToPassModal}
            />
          ),
        )}
      </>
    );
  }
}

ActionsList.propTypes = {
  intl: PropTypes.shape({
    formatMessage: PropTypes.func.isRequired,
  }).isRequired,
  layoutContextDispatch: PropTypes.func,
  amIPresenter: PropTypes.bool,
  amIModerator: PropTypes.bool,
  isPresentationEnabled: PropTypes.bool,
  isPresentationManagementDisabled: PropTypes.bool,
  presentations: PropTypes.array,
  isSharingVideo: PropTypes.bool,
  stopExternalVideoShare: PropTypes.func,
  allowExternalVideo: PropTypes.bool,
  isTimerActive: PropTypes.bool,
  isTimerEnabled: PropTypes.bool,
  isTimerFeatureEnabled: PropTypes.bool,
  hasCameraAsContent: PropTypes.bool,
  isCameraAsContentEnabled: PropTypes.bool,
  actionButtonDropdownItems: PropTypes.array,
  setPresentation: PropTypes.func,
  setPresentationFitToWidth: PropTypes.func,
  handleTakePresenter: PropTypes.func,
  activateTimer: PropTypes.func,
  deactivateTimer: PropTypes.func,
  onClose: PropTypes.func,
  onOpenExternalVideoModal: PropTypes.func,
  onOpenCameraAsContentModal: PropTypes.func,
};

ActionsList.defaultProps = {
  layoutContextDispatch: () => {},
  amIPresenter: false,
  amIModerator: false,
  isPresentationEnabled: false,
  isPresentationManagementDisabled: false,
  presentations: [],
  isSharingVideo: false,
  stopExternalVideoShare: () => {},
  allowExternalVideo: false,
  isTimerActive: false,
  isTimerEnabled: false,
  isTimerFeatureEnabled: false,
  hasCameraAsContent: false,
  isCameraAsContentEnabled: false,
  actionButtonDropdownItems: [],
  setPresentation: () => {},
  setPresentationFitToWidth: () => {},
  handleTakePresenter: () => {},
  activateTimer: () => {},
  deactivateTimer: () => {},
  onClose: null,
  onOpenExternalVideoModal: null,
  onOpenCameraAsContentModal: null,
};

export default injectIntl(ActionsList);
