import styled from "styled-components";
import {
  borderSize,
  borderSizeLarge,
  smPaddingX,
  toastContentWidth,
  borderRadius,
} from "../../../stylesheets/styled-components/general";
import {
  colorBlueLight,
  colorWhite,
  colorPrimary,
} from "../../../stylesheets/styled-components/palette";
import { TextElipsis } from "../../../stylesheets/styled-components/placeholders";
import Button from "/imports/ui/components/common/button/component";

const TimerSidebarContent = styled.div`
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: ${smPaddingX};
  display: flex;
  flex-grow: 1;
  flex-direction: column;
  justify-content: flex-start;
  overflow: hidden;
  height: 100%;
  color: #ffffff;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);

  & > header {
    margin-bottom: 2rem;

    button {
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
      padding: 0.5rem;
      border-radius: 8px;
      transition: background 0.2s;

      &:hover {
        background: rgba(255, 255, 255, 0.1) !important;
      }

      i {
        color: rgba(255, 255, 255, 0.7) !important;
        font-size: 1.2rem;
      }

      span {
        color: #fff !important;
        font-weight: 600;
        font-size: 1.1rem;
      }
    }
  }
`;

const TimerHeader = styled.header`
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
`;

const TimerTitle = styled.div`
  ${TextElipsis};
  flex: 1;
  font-weight: 600;
  font-size: 1.1rem;
  color: #fff;

  & > button,
  button:hover {
    max-width: ${toastContentWidth};
  }
`;

// @ts-ignore - JS code
const TimerMinimizeButton = styled(Button)`
  position: relative;
  background: transparent !important;
  display: block;
  margin: ${borderSizeLarge};
  margin-bottom: ${borderSize};
  padding: 0.25rem;
  border-radius: 50%;
  transition: all 0.2s;

  > i {
    color: rgba(255, 255, 255, 0.7);
    font-size: 1rem;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.1) !important;
    > i {
      color: #fff;
    }
  }
`;

const TimerContent = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
`;

const TimerCurrent = styled.span`
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  font-size: 4rem;
  font-weight: 700;
  justify-content: center;
  color: #fff;
  padding: 1.5rem 0;
  margin: 1rem 0;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
`;

const TimerType = styled.div`
  display: flex;
  width: 100%;
  justify-content: center;
  padding-top: 1rem;
`;

// @ts-ignore - JS code
const TimerSwitchButton = styled(Button)`
  flex: 1;
  height: 2.5rem;
  margin: 0 0.25rem;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.2s ease;

  &[class*="primary"] {
    background: linear-gradient(135deg, #1e3a8a, ${colorPrimary});
    border: none;
    color: #fff;
    box-shadow: 0 4px 15px rgba(30, 58, 138, 0.4);
  }

  &[class*="secondary"],
  &:not([class*="primary"]) {
    background: rgba(255, 255, 255, 0.05) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    color: rgba(255, 255, 255, 0.7) !important;
  }

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    filter: brightness(1.2);
  }
`;

const StopwatchTime = styled.div`
  display: flex;
  margin-top: 3rem;
  width: 100%;
  height: 3rem;
  font-size: x-large;
  justify-content: center;

  input {
    width: 4.5rem;
    font-size: 1.5rem;
  }
`;

const StopwatchTimeInput = styled.div`
  display: flex;
  flex-direction: column;

  .label {
    display: flex;
    font-size: 0.8rem;
    justify-content: center;
    color: rgba(255, 255, 255, 0.6);
    margin-top: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
`;

const StopwatchTimeInputLabel = styled.div`
  display: flex;
  font-size: 0.8rem;
  justify-content: center;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const StopwatchTimeColon = styled.span`
  align-self: flex-start;
  padding: 0.2rem 0.5rem;
  color: rgba(255, 255, 255, 0.5);
  font-size: 2rem;
  font-weight: 300;
`;

const TimerSongsWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-flow: column;
  margin-top: 2rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 1rem;
  padding-bottom: 0;
`;

const TimerRow = `
  display: flex;
  flex-flow: row;
  flex-grow: 1;
`;

const TimerCol = `
  display: flex;
  flex-flow: column;
  flex-grow: 1;
  flex-basis: 0;
`;

type TimerSongsTitleProps = {
  stopwatch: boolean;
};
const TimerSongsTitle = styled.div<TimerSongsTitleProps>`
  ${TimerRow}
  display: flex;
  font-weight: 600;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 0.5rem;
  opacity: ${(props: TimerSongsTitleProps) =>
    props.stopwatch ? "50%" : "100%"};
`;

const TimerTracks = styled.div`
  ${TimerCol}
  display: flex;
  margin-top: 0.5rem;
  margin-bottom: 1rem;
  width: 100%;

  .row {
    margin: 0.5rem auto;
  }

  label {
    display: flex;
    align-items: center;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 6px;
    transition: background 0.2s;
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.9rem;

    &:hover {
      background: rgba(255, 255, 255, 0.05);
      color: #fff;
    }
  }

  input[type="radio"] {
    margin: auto 0.75rem auto 0.25rem;
    accent-color: ${colorPrimary};
    width: 1.2rem;
    height: 1.2rem;
  }
`;

const TimerTrackItem = styled.div`
  ${TimerRow}
`;

const TimerControls = styled.div`
  display: flex;
  width: 100%;
  justify-content: center;
  margin-top: auto;
  padding-top: 2rem;
`;

// @ts-ignore - JS code
const TimerControlButton = styled(Button)`
  flex: 1;
  max-width: 8rem;
  height: 3rem;
  margin: 0 0.5rem;
  border-radius: 8px;
  font-weight: bold;
  font-size: 1rem;
  transition: all 0.2s;

  &[class*="primary"] {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    border: none;
    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
  }

  &[class*="danger"] {
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
    border: none;
    box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
  }

  &[class*="secondary"] {
    background: rgba(255, 255, 255, 0.1) !important;
    color: #fff !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    box-shadow: none;
  }

  &:hover {
    transform: translateY(-2px);
    filter: brightness(1.1);
  }

  &:active {
    transform: translateY(0);
  }
`;

const TimerInput = styled.input`
  flex: 1;
  border: 1px solid rgba(255, 255, 255, 0.2);
  width: 100%;
  text-align: center;
  padding: 0.5rem;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.3);
  color: #fff;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  outline: none;
  transition: all 0.2s;

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
    opacity: 1;
  }

  &:focus {
    border-radius: 8px;
    border-color: ${colorPrimary};
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.5);
    background: rgba(0, 0, 0, 0.5);
  }

  &:disabled,
  &[disabled] {
    cursor: not-allowed;
    opacity: 0.5;
    background-color: rgba(0, 0, 0, 0.1);
    border-color: transparent;
  }
`;

export default {
  TimerSidebarContent,
  TimerHeader,
  TimerTitle,
  TimerMinimizeButton,
  TimerContent,
  TimerCurrent,
  TimerType,
  TimerSwitchButton,
  StopwatchTime,
  StopwatchTimeInput,
  StopwatchTimeInputLabel,
  StopwatchTimeColon,
  TimerSongsWrapper,
  TimerSongsTitle,
  TimerTracks,
  TimerTrackItem,
  TimerControls,
  TimerControlButton,
  TimerInput,
};
