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
  hasTwoImages?: boolean; // Optional property to indicate if the meme has two images
};

type Position = {
  x: number;
  y: number;
};

type TextData = {
  text: string; // For the text content
  position: Position; // Position for the text
};

export default function MemeGenerator() {
  const [memes, setMemes] = useState<Meme[]>([]);
  const [visibleMemes, setVisibleMemes] = useState<Meme[]>([]);
  const [selectedMeme, setSelectedMeme] = useState<Meme | null>(null);
  const [textData, setTextData] = useState<{ [key: string]: TextData[] }>({});
  const [fontSize, setFontSize] = useState<number>(24);
  const [fontColor, setFontColor] = useState<string>("#000000");
  const [fontStyle, setFontStyle] = useState<string>("normal");
  const [loading, setLoading] = useState<boolean>(true);
  const [moreLoading, setMoreLoading] = useState<boolean>(false);
  const memeRef = useRef<HTMLDivElement>(null);
  const memesPerLoad = 4;

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
        const newTextData = [...(prev[selectedMeme.id] || [])];
        newTextData[index] = { ...newTextData[index], text: e.target.value };
        return { ...prev, [selectedMeme.id]: newTextData };
      });
    }
  };

  const handlePositionChange = (index: number, position: Position) => {
    if (selectedMeme) {
      setTextData((prev) => {
        const newTextData = [...(prev[selectedMeme.id] || [])];
        newTextData[index] = { ...newTextData[index], position };
        return { ...prev, [selectedMeme.id]: newTextData };
      });
    }
  };

  const handleAddTextBox = () => {
    if (selectedMeme) {
      setTextData((prev) => {
        const newTextData = [...(prev[selectedMeme.id] || []), { text: "", position: { x: 0, y: 0 } }];
        return { ...prev, [selectedMeme.id]: newTextData };
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, index: number) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent the default behavior of the Enter key
      handleAddTextBox(); // Add a new text box on Enter
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <div className="max-w-4xl w-full px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Meme Generator
            </h1>
            <p className="text-muted-foreground">
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
                  </Card>
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
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Customize Your Meme</CardTitle>
              </CardHeader>
              <CardContent>
                <div ref={memeRef} className="relative bg-muted rounded-lg overflow-hidden">
                  <Image
                    src={selectedMeme.url}
                    alt={selectedMeme.name}
                    width={300}
                    height={300}
                    className="object-cover w-full h-full"
                  />
                  
                  {/* Render Draggable Text Boxes */}
                  {textData[selectedMeme.id]?.map((textItem, index) => (
                    <Draggable
                      key={index}
                      position={textItem.position}
                      onDrag={(e, data) => {
                        handlePositionChange(index, { x: data.x, y: data.y });
                      }}
                    >
                      <div
                        className="absolute text-xl font-bold"
                        style={{
                          left: textItem.position.x,
                          top: textItem.position.y,
                          fontSize: `${fontSize}px`,
                          color: fontColor,
                          fontStyle: fontStyle === "italic" ? "italic" : "normal",
                          fontWeight: fontStyle === "bold" ? "bold" : "normal",
                          textDecoration: fontStyle === "underline" ? "underline" : "none",
                        }}
                      >
                        {textItem.text}
                      </div>
                    </Draggable>
                  ))}

                  {/* Text Areas for Text Input */}
                  {textData[selectedMeme.id]?.map((textItem, index) => (
                    <textarea
                      key={index}
                      value={textItem.text}
                      onChange={(e) => handleTextChange(e, index)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      className="mt-4 w-full"
                      placeholder={`Text for image ${index + 1}`}
                    />
                  ))}

                  <div className="mt-4 flex space-x-4">
                    <Button
                      onClick={() => setFontStyle("bold")}
                      variant={fontStyle === "bold" ? "default" : "secondary"}
                    >
                      Bold
                    </Button>
                    <Button
                      onClick={() => setFontStyle("italic")}
                      variant={fontStyle === "italic" ? "default" : "secondary"}
                    >
                      Italic
                    </Button>
                    <Button
                      onClick={() => setFontStyle("underline")}
                      variant={fontStyle === "underline" ? "default" : "secondary"}
                    >
                      Underline
                    </Button>
                  </div>

                  <Button onClick={handleDownload} className="mt-4">
                    Download Meme
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
