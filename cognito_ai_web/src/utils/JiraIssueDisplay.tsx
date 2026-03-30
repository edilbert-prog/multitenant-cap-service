import React from 'react';
import { motion } from 'framer-motion';

type RichTextMark = {
  type: 'strong' | string;
};

type RichTextNode =
| {
  type: 'text';
  text: string;
  marks?: RichTextMark[];
}
| {
  type: 'hardBreak';
};

type RichTextBlock = {
  type: 'paragraph' | 'bulletList' | 'orderedList' | 'listItem';
  content?: (RichTextBlock | RichTextNode)[];
};

type JiraDescription = {
  content: RichTextBlock[];
};

type JiraFields = {
  summary: string;
  assignee?: {
    displayName: string;
  };
  project?: {
    name: string;
  };
  status?: {
    name: string;
  };
  description?: JiraDescription;
};

type Props = {
  fields: JiraFields;
  children?: React.ReactNode;
};

export default function JiraIssueDisplay({ fields }: Props) {
  const renderRichText = (content: (RichTextBlock | RichTextNode)[] = [], insideList = false): React.ReactNode[] => {
    return content.map((block, index) => {
      if ('type' in block && block.type === 'paragraph') {
        const texts = block.content?.map((textNode, i) => {
          if ('type' in textNode && textNode.type === 'text') {
            const isBold = textNode.marks?.some((m) => m.type === 'strong');
            return (
                <span key={i} className={isBold ? 'font-semibold' : ''}>
                {textNode.text}
              </span>
            );
          } else if ('type' in textNode && textNode.type === 'hardBreak') {
            return <br key={i} />;
          }
          return null;
        });

        return insideList ? (
            <span key={index}>{texts}</span>
        ) : (
            <p key={index} className="mb-2">
              {texts}
            </p>
        );
      }

      if ('type' in block && block.type === 'bulletList') {
        return (
            <ul key={index} className="list-disc list-inside mb-2">
              {block.content?.map((li, i) => (
                  <li key={i}>{renderRichText((li as RichTextBlock).content ?? [], true)}</li>
              ))}
            </ul>
        );
      }

      if ('type' in block && block.type === 'orderedList') {
        return (
            <ol key={index} className="list-decimal list-inside mb-2">
              {block.content?.map((li, i) => (
                  <li key={i}>{renderRichText((li as RichTextBlock).content ?? [], true)}</li>
              ))}
            </ol>
        );
      }

      return null;
    });
  };

  const { summary, assignee, project, status, description } = fields;

  return (
      <motion.div
          className="p-4 bg-white border border-gray-300 rounded-md mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
      >
        <h2 className="text-2xl font-bold mb-4 text-blue-700">{summary}</h2>

        <div className="mb-4">
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Project:</span> {project?.name}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Assignee:</span> {assignee?.displayName}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Status:</span>{' '}
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md">{status?.name}</span>
          </p>
        </div>

        <div className="prose max-w-none">{description?.content && renderRichText(description.content)}</div>
      </motion.div>
  );
}
