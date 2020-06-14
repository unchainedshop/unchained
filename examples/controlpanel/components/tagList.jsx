import React from 'react';

const TagList = ({ tags }) =>
  Array.isArray(tags)
    ? tags.map((t) => (
        <span key={t} className="tag-item">
          {t}
        </span>
      ))
    : '';

export default TagList;
