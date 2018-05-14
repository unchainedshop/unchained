import React from 'react';
import { Image } from 'semantic-ui-react';
import Dropzone from 'react-dropzone';

export default ({ avatarUrl, handleChange }) => (
  <div className="fixed-height">
    <Dropzone
      style={{
        border: 0,
      }}
      className="ui container"
      onDrop={handleChange}
      multiple={false}
      accept="image/*"
    >
      <Image
        label={{ color: 'blue', corner: 'right', icon: 'edit' }}
        src={avatarUrl}
        width={150}
        height={150}
        bordered
        shape="rounded"
      />
    </Dropzone>
    <style jsx>{`
      .fixed-height {
        height: 150px;
      }
    `}
    </style>
  </div>
);
