import classNames from 'classnames';
import AccordionItem from './AccordionItem';

const Accordion = ({
  data,
  containerCSS = '',
  headerCSS = '',
  bodyCSS = '',
  itemContainerCSS = '',
  hideChevron = false,
  ...rest
}) => {
  return (
    <div className={classNames('my-3', containerCSS)} {...rest}>
      {data.map(({ header, body }, key) => (
        <AccordionItem
          itemindex={key}
          header={header}
          body={body}
          key={key}
          headerCSS={headerCSS}
          bodyCSS={bodyCSS}
          itemContainerCSS={itemContainerCSS}
          hideChevron={hideChevron}
        />
      ))}
    </div>
  );
};

export default Accordion;
