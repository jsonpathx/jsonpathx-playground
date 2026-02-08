import { useMemo } from 'react';
import { highlightText } from '../utils/search-utils';

interface HighlightedTextProps {
  text: string;
  searchTerm: string;
  caseSensitive?: boolean;
  highlightClassName?: string;
}

/**
 * Component that highlights search matches in text
 */
const HighlightedText = ({
  text,
  searchTerm,
  caseSensitive = false,
  highlightClassName = 'bg-yellow-400 text-gray-900 font-semibold px-0.5 rounded',
}: HighlightedTextProps) => {
  const segments = useMemo(
    () => highlightText(text, searchTerm, caseSensitive),
    [text, searchTerm, caseSensitive]
  );

  if (!searchTerm) {
    return <>{text}</>;
  }

  return (
    <>
      {segments.map((segment, index) =>
        segment.isMatch ? (
          <mark key={index} className={highlightClassName}>
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        )
      )}
    </>
  );
};

export default HighlightedText;
