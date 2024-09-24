"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import Draggable from "react-draggable";
import html2canvas from "html2canvas";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ClipLoader from "react-spinners/ClipLoader";

type Meme = {
  id: string;
  name: string;
  url: string;
  hasTwoImages?: boolean;
};

type Position = {
  x: number;
  y: number;
};

type TextData = {
  text1: string;
  position1: Position;
  text2?: string;
  position2?: Position;
};

export default function MemeGenerator() {
  const [memes, setMemes] = useState<Meme[]>([]);
  const [visibleMemes, setVisibleMemes] = useState<Meme[]>([]);
  const [selectedMeme, setSelectedMeme] = useState<Meme | null>(null);
  const [textData, setTextData] = useState<{ [key: string]: TextData }>({});
  const [fontSize, setFontSize] = useState<number>(24);
  const [fontColor, setFontColor] = useState<string>("#000000");
  const [fontStyle, setFontStyle] = useState<string>("normal");
  const [filter, setFilter] = useState<string>("none");
  const [animation, setAnimation] = useState<string>("none");
  const [loading, setLoading] = useState<boolean>(true);
  const [moreLoading, setMoreLoading] = useState<boolean>(false);
  const memeRef = useRef<HTMLDivElement>(null);
  const memesPerLoad = 4;

  // Stickers and emojis
  const [stickers] = useState<string[]>(["😎", "🔥", "😂", "🚀", "🎉"]);
  const [selectedSticker, setSelectedSticker] = useState<string | null>(null);
  const [stickerPosition, setStickerPosition] = useState<Position>({ x: 0, y: 0 });

  useEffect(() => {
    const fetchMemes = async () => {
      setLoading(true);
      const response = await fetch("https://api.imgflip.com/get_memes");
      const data = await response.json();
      setMemes(data.data.memes);
      setVisibleMemes(data.data.memes.slice(0, memesPerLoad));
      setLoading(false);
    };
    fetchMemes();
  }, []);

  const loadMoreMemes = (): void => {
    setMoreLoading(true);
    const newVisibleMemes = memes.slice(0, visibleMemes.length + memesPerLoad);
    setVisibleMemes(newVisibleMemes);
    setMoreLoading(false);
  };

  const handleDownload = async (): Promise<void> => {
    if (memeRef.current) {
      const canvas = await html2canvas(memeRef.current);
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = "meme.png";
      link.click();
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>, index: number) => {
    if (selectedMeme) {
      setTextData((prev) => {
        const newTextData = { ...prev };

        if (index === 1) {
          newTextData[selectedMeme.id] = {
            ...prev[selectedMeme.id],
            text1: e.target.value,
            position1: prev[selectedMeme.id]?.position1 || { x: 0, y: 0 },
          };
        } else if (index === 2) {
          newTextData[selectedMeme.id] = {
            ...prev[selectedMeme.id],
            text2: e.target.value,
            position2: prev[selectedMeme.id]?.position2 || { x: 0, y: 0 },
          };
        }

        return newTextData;
      });
    }
  };

  const handlePositionChange = (index: number, position: Position) => {
    if (selectedMeme) {
      setTextData((prev) => ({
        ...prev,
        [selectedMeme.id]: {
          ...prev[selectedMeme.id],
          [`position${index}`]: position,
        },
      }));
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground bg-neutral-500">
      <div className="max-w-4xl w-full px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Meme Generator
            </h1>
            <p className="text-muted-foreground bg-white text-gray-500">
              Create custom memes with our easy-to-use generator.
            </p>
          </div>

          {loading ? (
            <ClipLoader className="w-12 h-12 text-blue-500" />
          ) : (
            <>
              <div className="w-full overflow-x-scroll whitespace-nowrap py-2">
  {visibleMemes.map((meme) => (
    <Card
      key={meme.id}
      className="inline-block bg-muted rounded-lg overflow-hidden cursor-pointer transition-transform hover:scale-105 mx-2"
      onClick={() => setSelectedMeme(meme)}
    >
      <Image
        src={meme.url}
        alt={meme.name}
        width={300}
        height={300}
        className="object-cover w-full h-full"
      />
      <CardContent>
        <p className="text-center">{meme.name}</p>
      </CardContent>
    </Card> // Ensure you have this closing tag for the Card component
  ))}
</div>

              {visibleMemes.length < memes.length && (
                <Button
                  onClick={loadMoreMemes}
                  className="mt-4"
                  disabled={moreLoading}
                >
                  {moreLoading ? (
                    <ClipLoader className="w-6 h-6 text-white" />
                  ) : (
                    "Load More"
                  )}
                </Button>
              )}
            </>
          )}

          {selectedMeme && (
            <Card className="w-full max-w-md bg-neutral-400">
              <CardHeader>
                <CardTitle>Customize Your Meme</CardTitle>
              </CardHeader>
              <CardContent>
                <div ref={memeRef} className="relative bg-muted rounded-lg overflow-hidden" style={{ filter }}>
                  <Image
                    src={selectedMeme.url}
                    alt={selectedMeme.name}
                    width={300}
                    height={300}
                    className={`object-cover w-full h-full ${animation}`}
                  />

                  {/* Draggable Text Box for Text 1 */}
                  <Draggable
                    position={textData[selectedMeme.id]?.position1 || { x: 0, y: 0 }}
                    onDrag={(e, data) => {
                      handlePositionChange(1, { x: data.x, y: data.y });
                    }}
                  >
                    <div
                      className="absolute text-xl font-bold"
                      style={{
                        left: textData[selectedMeme.id]?.position1?.x || 0,
                        top: textData[selectedMeme.id]?.position1?.y || 0,
                        fontSize: `${fontSize}px`,
                        color: fontColor,
                        fontStyle: fontStyle === "italic" ? "italic" : "normal",
                        fontWeight: fontStyle === "bold" ? "bold" : "normal",
                        textDecoration: fontStyle === "underline" ? "underline" : "none",
                      }}
                    >
                      {textData[selectedMeme.id]?.text1 || ""}
                    </div>
                  </Draggable>

                  {/* Draggable Text Box for Text 2 (Only for two-image memes) */}
                  {selectedMeme && (
                    <Draggable
                      position={textData[selectedMeme.id]?.position2 || { x: 0, y: 0 }}
                      onDrag={(e, data) => {
                        handlePositionChange(2, { x: data.x, y: data.y });
                      }}
                    >
                      <div
                        className="absolute text-xl font-bold"
                        style={{
                          left: textData[selectedMeme.id]?.position2?.x || 0,
                          top: textData[selectedMeme.id]?.position2?.y || 0,
                          fontSize: `${fontSize}px`,
                          color: fontColor,
                          fontStyle: fontStyle === "italic" ? "italic" : "normal",
                          fontWeight: fontStyle === "bold" ? "bold" : "normal",
                          textDecoration: fontStyle === "underline" ? "underline" : "none",
                        }}
                      >
                        {textData[selectedMeme.id]?.text2 || ""}
                      </div>
                    </Draggable>
                  )}

                  {/* Draggable Sticker */}
                  {selectedSticker && (
                    <Draggable
                      position={stickerPosition}
                      onDrag={(e, data) => setStickerPosition({ x: data.x, y: data.y })}
                    >
                      <div className="absolute text-4xl">
                        {selectedSticker}
                      </div>
                    </Draggable>
                  )}
                </div>

                <textarea
                  className="w-full mt-4 p-2 border rounded"
                  placeholder="Text for Top"
                  value={textData[selectedMeme.id]?.text1 || ""}
                  onChange={(e) => handleTextChange(e, 1)}
                />
                
                  <textarea
                    className="w-full mt-2 p-2 border rounded"
                    placeholder="Text for Bottom"
                    value={textData[selectedMeme.id]?.text2 || ""}
                    onChange={(e) => handleTextChange(e, 2)}
                  />
                
                <div className="mt-4">
                  <label className="block">Font Size</label>
                  <input
                    type="range"
                    min="12"
                    max="72"
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                  />
                </div>
                <div className="mt-4">
                  <label className="block">Font Color</label>
                  <input
                    type="color"
                    value={fontColor}
                    onChange={(e) => setFontColor(e.target.value)}
                  />
                </div>
                <div className="mt-4">
                  <label className="block">Font Style</label>
                  <select
                    value={fontStyle}
                    onChange={(e) => setFontStyle(e.target.value)}
                  >
                    <option value="normal">Normal</option>
                    <option value="bold">Bold</option>
                    <option value="italic">Italic</option>
                    <option value="underline">Underline</option>
                  </select>
                </div>
                <div className="mt-4">
                  <label className="block">Filter</label>
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="none">None</option>
                    <option value="grayscale(100%)">Grayscale</option>
                    <option value="sepia(100%)">Sepia</option>
                  </select>
                </div>
                <div className="mt-4">
                  <label className="block">Animation</label>
                  <select
                    value={animation}
                    onChange={(e) => setAnimation(e.target.value)}
                  >
                    <option value="none">None</option>
                    <option value="animate-pulse">Pulse</option>
                    <option value="animate-bounce">Bounce</option>
                  </select>
                </div>
                <div className="mt-4">
                  <Button onClick={handleDownload}>Download Meme</Button>
                </div>

                {/* Stickers */}
                <div className="mt-4 flex space-x-2 hover:bg-white">
                  {stickers.map((sticker) => (
                    <Button
                    key={sticker}
                    onClick={() => setSelectedSticker(sticker)}
                    className={`bg-transparent text-2xl transition-colors duration-300 ${selectedSticker === sticker ? 'bg-white text-black' : ''}`}
                  >
                    {sticker}
                  </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
