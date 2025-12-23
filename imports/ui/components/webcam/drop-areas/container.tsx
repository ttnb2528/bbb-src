import React from 'react';
import { layoutSelectInput, layoutSelectOutput } from '/imports/ui/components/layout/context';
import { Output } from '/imports/ui/components/layout/layoutTypes';
import DropArea from './component';

const DropAreaContainer = () => {
  const cameraDockInput = layoutSelectInput((i: any) => i.cameraDock);
  const dropZoneAreas = layoutSelectOutput((i: Output) => i.dropZoneAreas);

  // Chỉ hiển thị overlay drop zone khi đang kéo camera dock
  if (!cameraDockInput?.isDragging) return null;

  return (
    Object.keys(dropZoneAreas).map((objectKey) => (
      <DropArea
        dataTest={`dropArea-${objectKey}`}
        key={objectKey}
        id={objectKey}
        style={dropZoneAreas[objectKey]}
      />
    ))
  );
};

export default DropAreaContainer;
