import React, { useState } from 'react';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { ArrowLeft, FileText, Folder } from 'lucide-react';

type FileNode = {
  name: string;
  type: 'file';
};

type FolderNode = {
  name: string;
  type: 'folder';
  children: NodeItem[];
};

type NodeItem = FileNode | FolderNode;

type Props = {
  onFileSelect?: (fileName: string) => void;
  children?: React.ReactNode;
};

const fileSystem: FolderNode = {
  name: 'Shared Documents',
  type: 'folder',
  children: [
    {
      name: 'Processes',
      type: 'folder',
      children: [
        {
          name: 'Delivery Management',
          type: 'folder',
          children: [{ name: 'Delivery Split.png', type: 'file' }],
        },
        {
          name: 'Order Management',
          type: 'folder',
          children: [{ name: 'Order-to-cash.png', type: 'file' }],
        },
      ],
    },
    { name: 'readme.txt', type: 'file' },
  ],
} as const;

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.09,
    },
  },
} satisfies Variants;

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
} satisfies Variants;

export default function FileExplorer({ onFileSelect }: Props) {
  const [path, setPath] = useState<string[]>(['Shared Documents']);
  const [animationKey, setAnimationKey] = useState<number>(0);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);

  const getFolderFromPath = (p: string[]): FolderNode => {
    let current: FolderNode = fileSystem;
    for (let i = 1; i < p.length; i++) {
      const next = current.children.find((c) => c.name === p[i] && c.type === 'folder') as FolderNode | undefined;
      if (!next) break;
      current = next;
    }
    return current;
  };

  const currentFolder = getFolderFromPath(path);

  const handleFolderClick = (folderName: string) => {
    setPath((prev) => [...prev, folderName]);
    setSelectedFilePath(null);
    setAnimationKey((k) => k + 1);
  };

  const handleBreadcrumbClick = (index: number) => {
    setPath((prev) => prev.slice(0, index + 1));
    setSelectedFilePath(null);
    setAnimationKey((k) => k + 1);
  };

  const goBack = () => {
    if (path.length > 1) {
      setPath((prev) => prev.slice(0, -1));
      setSelectedFilePath(null);
      setAnimationKey((k) => k + 1);
    }
  };

  const handleFileClick = (fileName: string) => {
    const fullPath = [...path, fileName].join('/');
    setSelectedFilePath(fullPath);
    if (onFileSelect) {
      onFileSelect(fileName);
    }
  };

  const isSelected = (fileName: string) => selectedFilePath === [...path, fileName].join('/');

  return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-2 text-sm text-gray-600 flex-wrap mb-4">
          {path.map((segment, index) => (
              <span key={index} className="flex items-center gap-2">
            {index > 0 && <span className="text-gray-400">/</span>}
                <button
                    onClick={() => handleBreadcrumbClick(index)}
                    className={`hover:underline transition ${
                        index === path.length - 1 && !selectedFilePath ? 'font-medium text-blue-600' : ''
                    }`}
                >
              {segment}
            </button>
          </span>
          ))}

          {selectedFilePath && (
              <>
                <span className="text-gray-400">/</span>
                <span className="font-medium text-blue-600">{selectedFilePath.split('/').pop()}</span>
              </>
          )}
          {path.length > 1 && (
              <button onClick={goBack} className="ml-auto flex items-center gap-1 text-blue-600 text-sm hover:underline">
                <ArrowLeft size={14} /> Back
              </button>
          )}
        </div>

        <AnimatePresence mode="popLayout">
          <motion.ul
              key={animationKey}
              initial="hidden"
              animate="show"
              exit="hidden"
              variants={containerVariants}
              className="overflow-hidden"
          >
            {currentFolder.children?.map((item: NodeItem, index: number) => {
              const isFile = item.type === 'file';
              const selected = isFile && isSelected(item.name);

              return (
                  <motion.li
                      key={index}
                      variants={itemVariants}
                      onClick={() => (isFile ? handleFileClick(item.name) : handleFolderClick(item.name))}
                      className={`flex bg-white border rounded-md mb-2 items-center justify-between px-4 py-3 cursor-pointer transition group ${
                          selected ? 'bg-blue-50 border-l-4 border-blue-600' : 'hover:bg-gray-50 border-gray-300'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.type === 'folder' ? (
                          <Folder className="text-yellow-500 w-5 h-5" />
                      ) : (
                          <FileText className="text-blue-500 w-5 h-5" />
                      )}
                      <span className="text-sm text-gray-800">{item.name}</span>
                    </div>

                    {selected && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md font-medium">Selected</span>
                    )}
                  </motion.li>
              );
            })}
          </motion.ul>
        </AnimatePresence>
      </div>
  );
}
