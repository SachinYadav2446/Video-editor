import { useState, useEffect } from "react";

export default function Documents({ onBack, user, initialProject }) {
  const [projectTitle, setProjectTitle] = useState(() => {
    return initialProject ? initialProject.title : "Corporate Brand Report";
  });
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [docBlocks, setDocBlocks] = useState([
    { id: "b_title", type: "h1", content: "Q2 Marketing Strategy & Projections" },
    { id: "b_intro", type: "p", content: "This document outlines the projected customer acquisition costs (CAC) and conversion trends for our newly launched omni-channel campaigns." },
    { id: "b_quote", type: "quote", content: "Design is not just what it looks like and feels like. Design is how it works. — Steve Jobs" },
    { id: "b_table", type: "table", headers: ["Quarter", "Conversion (%)", "Budget ($K)"], rows: [
      ["Q1 Launch", "2.4", "45"],
      ["Q2 Expansion", "3.8", "80"],
      ["Q3 Optimize", "5.2", "110"]
    ]},
    { id: "b_chart", type: "chart", chartType: "bar", title: "Conversion Growth Trend" },
    { id: "b_sign", type: "signature", name: "Sarah Jenkins", role: "VP of Brand Strategy" }
  ]);
  const [activeBlockId, setActiveBlockId] = useState("b_intro");

  useEffect(() => {
    if (initialProject && initialProject.data) {
      const d = initialProject.data;
      if (d.docBlocks) setDocBlocks(d.docBlocks);
    }
  }, [initialProject]);

  const updateBlockContent = (id, newContent) => {
    setDocBlocks(prev => prev.map(b => b.id === id ? { ...b, content: newContent } : b));
  };

  // Table manipulation helpers
  const updateTableCell = (blockId, rowIdx, colIdx, val) => {
    setDocBlocks(prev => prev.map(b => {
      if (b.id === blockId && b.type === "table") {
        const newRows = [...b.rows];
        newRows[rowIdx] = [...newRows[rowIdx]];
        newRows[rowIdx][colIdx] = val;
        return { ...b, rows: newRows };
      }
      return b;
    }));
  };

  const addTableRow = (blockId) => {
    setDocBlocks(prev => prev.map(b => {
      if (b.id === blockId && b.type === "table") {
        const newRow = Array(b.headers.length).fill("");
        return { ...b, rows: [...b.rows, newRow] };
      }
      return b;
    }));
  };

  const deleteTableRow = (blockId, rowIdx) => {
    setDocBlocks(prev => prev.map(b => {
      if (b.id === blockId && b.type === "table") {
        const newRows = b.rows.filter((_, idx) => idx !== rowIdx);
        return { ...b, rows: newRows };
      }
      return b;
    }));
  };

  // Block Insertion helpers
  const addBlock = (type) => {
    const id = `block_${Date.now()}`;
    let newBlock = { id, type, content: "New block content..." };
    if (type === "table") {
      newBlock = {
        id,
        type,
        headers: ["Category", "Metric A", "Metric B"],
        rows: [["Category A", "10", "20"], ["Category B", "15", "25"]]
      };
    } else if (type === "chart") {
      newBlock = {
        id,
        type,
        chartType: "bar",
        title: "New Interactive Data Chart"
      };
    } else if (type === "signature") {
      newBlock = {
        id,
        type,
        name: user?.name || "John Doe",
        role: "Project Representative"
      };
    }
    setDocBlocks(prev => [...prev, newBlock]);
    setActiveBlockId(id);
  };

  const deleteBlock = (id) => {
    setDocBlocks(prev => prev.filter(b => b.id !== id));
    if (activeBlockId === id) setActiveBlockId(null);
  };

  // SVG Chart Engine
  const renderSVGChart = (block) => {
    // Find the nearest table block above this chart to fetch data from
    const tableBlock = docBlocks.find(b => b.type === "table");
    if (!tableBlock || !tableBlock.rows || tableBlock.rows.length === 0) {
      return (
        <div style={{ padding: "20px", textAlign: "center", color: "#666", fontSize: "11px" }}>
          Insert a data table to populate chart values automatically.
        </div>
      );
    }

    const dataPoints = tableBlock.rows.map(row => {
      const label = row[0] || "Label";
      const val = parseFloat(row[1]) || 0;
      return { label, val };
    });

    const maxVal = Math.max(...dataPoints.map(p => p.val), 1);
    const chartW = 460;
    const chartH = 200;
    const padding = 30;
    const graphW = chartW - padding * 2;
    const graphH = chartH - padding * 2;

    if (block.chartType === "line") {
      // SVG Line Chart
      const points = dataPoints.map((p, idx) => {
        const x = padding + (idx / Math.max(dataPoints.length - 1, 1)) * graphW;
        const y = padding + graphH - (p.val / maxVal) * graphH;
        return `${x},${y}`;
      }).join(" ");

      return (
        <div style={{ textAlign: "center" }}>
          <h5 style={{ margin: "0 0 10px", fontSize: "12px", color: "#333", fontWeight: 600 }}>{block.title || "Interactive Graph"}</h5>
          <svg width={chartW} height={chartH} style={{ background: "#fcfcfc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
              <line key={i} x1={padding} y1={padding + ratio * graphH} x2={chartW - padding} y2={padding + ratio * graphH} stroke="#edf2f7" strokeWidth="1" />
            ))}
            {/* The Line path */}
            <polyline fill="none" stroke="#6366f1" strokeWidth="3" points={points} />
            {/* Nodes */}
            {dataPoints.map((p, idx) => {
              const x = padding + (idx / Math.max(dataPoints.length - 1, 1)) * graphW;
              const y = padding + graphH - (p.val / maxVal) * graphH;
              return (
                <g key={idx}>
                  <circle cx={x} cy={y} r="5" fill="#f5c842" stroke="#6366f1" strokeWidth="2" />
                  <text x={x} y={y - 10} textAnchor="middle" fontSize="9" fill="#2d3748" fontWeight="bold">{p.val}%</text>
                  <text x={x} y={chartH - 12} textAnchor="middle" fontSize="8.5" fill="#718096">{p.label}</text>
                </g>
              );
            })}
          </svg>
        </div>
      );
    } else {
      // SVG Bar Chart
      const barW = Math.min(40, graphW / dataPoints.length - 12);
      return (
        <div style={{ textAlign: "center" }}>
          <h5 style={{ margin: "0 0 10px", fontSize: "12px", color: "#333", fontWeight: 600 }}>{block.title || "Quarterly Conversion metrics"}</h5>
          <svg width={chartW} height={chartH} style={{ background: "#fcfcfc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
              <line key={i} x1={padding} y1={padding + ratio * graphH} x2={chartW - padding} y2={padding + ratio * graphH} stroke="#edf2f7" strokeWidth="1" />
            ))}
            {/* Bars */}
            {dataPoints.map((p, idx) => {
              const x = padding + (idx / dataPoints.length) * graphW + (graphW / dataPoints.length - barW) / 2;
              const barH = (p.val / maxVal) * graphH;
              const y = padding + graphH - barH;
              return (
                <g key={idx}>
                  <rect x={x} y={y} width={barW} height={barH} fill="url(#barGrad)" rx="3" />
                  <text x={x + barW / 2} y={y - 8} textAnchor="middle" fontSize="9" fill="#2d3748" fontWeight="bold">{p.val}%</text>
                  <text x={x + barW / 2} y={chartH - 12} textAnchor="middle" fontSize="8.5" fill="#718096">{p.label}</text>
                </g>
              );
            })}
            <defs>
              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      );
    }
  };

  const handleSaveAndExit = () => {
    const savedWorks = JSON.parse(localStorage.getItem("creatify_past_works") || "[]");
    const projectId = initialProject?.id || `doc_${Date.now()}`;
    const existingIdx = savedWorks.findIndex(w => w.id === projectId);

    const projectData = {
      id: projectId,
      title: projectTitle.trim() || "Untitled Report Document",
      category: "Document",
      tool: "Documents",
      year: new Date().getFullYear().toString(),
      accent: "#deb887",
      gradient: "linear-gradient(135deg, #1c1813 0%, #3e3223 50%, #0c0a09 100%)",
      image: "",
      icon: "📄",
      tags: ["DOCX · PDF", `${docBlocks.length} Blocks`, "Charts"],
      desc: `Interactive corporate document with ${docBlocks.length} formatted nodes.`,
      data: {
        docBlocks
      }
    };

    if (existingIdx > -1) {
      savedWorks[existingIdx] = projectData;
    } else {
      savedWorks.unshift(projectData);
    }
    localStorage.setItem("creatify_past_works", JSON.stringify(savedWorks));

    const token = localStorage.getItem("creatify_token");
    if (token) {
      fetch((window.API_URL || "http://localhost:3001") + "/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(projectData)
      })
      .then(res => {
        if (!res.ok) throw new Error("Server rejected save");
        console.log("Saved document to DB successfully");
      })
      .catch(err => {
        console.error("DB save error:", err.message);
      })
      .finally(() => {
        onBack();
      });
    } else {
      onBack();
    }
  };

  const handleDiscardAndExit = () => {
    onBack();
  };

  const getSVGChartString = (block) => {
    const tableBlock = docBlocks.find(b => b.type === "table");
    if (!tableBlock || !tableBlock.rows || tableBlock.rows.length === 0) {
      return "";
    }
    const dataPoints = tableBlock.rows.map(row => {
      const label = row[0] || "Label";
      const val = parseFloat(row[1]) || 0;
      return { label, val };
    });
    const maxVal = Math.max(...dataPoints.map(p => p.val), 1);
    const chartW = 460;
    const chartH = 200;
    const padding = 30;
    const graphW = chartW - padding * 2;
    const graphH = chartH - padding * 2;

    if (block.chartType === "line") {
      const points = dataPoints.map((p, idx) => {
        const x = padding + (idx / Math.max(dataPoints.length - 1, 1)) * graphW;
        const y = padding + graphH - (p.val / maxVal) * graphH;
        return `${x},${y}`;
      }).join(" ");

      let gridLines = "";
      [0, 0.25, 0.5, 0.75, 1].forEach((ratio) => {
        gridLines += `<line x1="${padding}" y1="${padding + ratio * graphH}" x2="${chartW - padding}" y2="${padding + ratio * graphH}" stroke="#edf2f7" stroke-width="1" />`;
      });

      let nodes = "";
      dataPoints.forEach((p, idx) => {
        const x = padding + (idx / Math.max(dataPoints.length - 1, 1)) * graphW;
        const y = padding + graphH - (p.val / maxVal) * graphH;
        nodes += `<circle cx="${x}" cy="${y}" r="5" fill="#f5c842" stroke="#6366f1" stroke-width="2" />
        <text x="${x}" y="${y - 10}" text-anchor="middle" font-size="9" fill="#2d3748" font-weight="bold">${p.val}%</text>
        <text x="${x}" y="${chartH - 12}" text-anchor="middle" font-size="8.5" fill="#718096">${p.label}</text>`;
      });

      return `<svg width="${chartW}" height="${chartH}" style="background: #fcfcfc; border-radius: 10px; border: 1px solid #e2e8f0; font-family: sans-serif;">
        ${gridLines}
        <polyline fill="none" stroke="#6366f1" stroke-width="3" points="${points}" />
        ${nodes}
      </svg>`;
    } else {
      const barW = Math.min(40, graphW / dataPoints.length - 12);
      let gridLines = "";
      [0, 0.25, 0.5, 0.75, 1].forEach((ratio) => {
        gridLines += `<line x1="${padding}" y1="${padding + ratio * graphH}" x2="${chartW - padding}" y2="${padding + ratio * graphH}" stroke="#edf2f7" stroke-width="1" />`;
      });

      let bars = "";
      dataPoints.forEach((p, idx) => {
        const x = padding + (idx / dataPoints.length) * graphW + (graphW / dataPoints.length - barW) / 2;
        const barH = (p.val / maxVal) * graphH;
        const y = padding + graphH - barH;
        bars += `<rect x="${x}" y="${y}" width="${barW}" height="${barH}" fill="url(#barGrad)" rx="3" />
        <text x="${x + barW / 2}" y="${y - 8}" text-anchor="middle" font-size="9" fill="#2d3748" font-weight="bold">${p.val}%</text>
        <text x="${x + barW / 2}" y="${chartH - 12}" text-anchor="middle" font-size="8.5" fill="#718096">${p.label}</text>`;
      });

      return `<svg width="${chartW}" height="${chartH}" style="background: #fcfcfc; border-radius: 10px; border: 1px solid #e2e8f0; font-family: sans-serif;">
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#6366f1" />
            <stop offset="100%" stop-color="#a855f7" />
          </linearGradient>
        </defs>
        ${gridLines}
        ${bars}
      </svg>`;
    }
  };

  const exportAsHTML = () => {
    let htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${projectTitle}</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&family=Syne:wght@700;800&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Poppins', sans-serif;
      background: #f7fafc;
      color: #1a202c;
      margin: 0;
      padding: 40px 20px;
    }
    .sheet {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      padding: 60px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      gap: 28px;
    }
    h1 {
      font-family: 'Syne', sans-serif;
      font-size: 32px;
      font-weight: 800;
      margin: 0;
      color: #111;
      letter-spacing: -0.02em;
    }
    h2 {
      font-size: 22px;
      font-weight: 600;
      margin: 0;
      color: #2d3748;
      border-bottom: 2px solid #edf2f7;
      padding-bottom: 8px;
    }
    p {
      font-size: 15px;
      line-height: 1.6;
      color: #4a5568;
      margin: 0;
    }
    .quote {
      border-left: 4px solid #6366f1;
      padding: 12px 18px;
      font-style: italic;
      font-size: 14.5px;
      color: #4a5568;
      background: #f7fafc;
      border-radius: 0 6px 6px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
      text-align: left;
      margin-top: 10px;
    }
    th {
      padding: 10px 12px;
      font-weight: 600;
      color: #2d3748;
      background: #edf2f7;
      border-bottom: 2px solid #cbd5e0;
    }
    td {
      padding: 10px 12px;
      border-bottom: 1px solid #e2e8f0;
      color: #4a5568;
    }
    .chart-container {
      text-align: center;
      margin: 20px 0;
    }
    .chart-title {
      font-size: 14px;
      color: #2d3748;
      font-weight: 600;
      margin-bottom: 12px;
    }
    .signature {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      margin-top: 24px;
    }
    .sig-line {
      width: 180px;
      border-bottom: 1.5px solid #1a202c;
      padding-bottom: 6px;
      text-align: center;
      font-family: cursive;
      font-size: 18px;
      color: #6366f1;
    }
    .sig-role {
      font-size: 11px;
      color: #718096;
      margin-top: 6px;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="sheet">
`;

    docBlocks.forEach(block => {
      if (block.type === "h1") {
        htmlContent += `    <h1>${block.content}</h1>\n`;
      } else if (block.type === "h2") {
        htmlContent += `    <h2>${block.content}</h2>\n`;
      } else if (block.type === "p") {
        htmlContent += `    <p>${block.content}</p>\n`;
      } else if (block.type === "quote") {
        htmlContent += `    <div class="quote">${block.content}</div>\n`;
      } else if (block.type === "table") {
        htmlContent += `    <table>\n      <thead>\n        <tr>\n`;
        block.headers.forEach(h => {
          htmlContent += `          <th>${h}</th>\n`;
        });
        htmlContent += `        </tr>\n      </thead>\n      <tbody>\n`;
        block.rows.forEach(row => {
          htmlContent += `        <tr>\n`;
          row.forEach(cell => {
            htmlContent += `          <td>${cell}</td>\n`;
          });
          htmlContent += `        </tr>\n`;
        });
        htmlContent += `      </tbody>\n    </table>\n`;
      } else if (block.type === "chart") {
        const svgString = getSVGChartString(block);
        htmlContent += `    <div class="chart-container">\n      <div class="chart-title">${block.title || "Data Trend"}</div>\n      ${svgString}\n    </div>\n`;
      } else if (block.type === "signature") {
        htmlContent += `    <div class="signature">\n      <div class="sig-line">${block.name}</div>\n      <div class="sig-role">${block.role}</div>\n    </div>\n`;
      }
    });

    htmlContent += `  </div>\n</body>\n</html>`;

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `${projectTitle.replace(/\s+/g, "_")}.html`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const triggerPrint = () => {
    window.print();
  };

  const activeBlock = docBlocks.find(b => b.id === activeBlockId);

  return (
    <div style={{ background: "#0c0a09", color: "#e5e5e5", fontFamily: "'Poppins',sans-serif", height: "100vh", width: "100vw", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .print-sheet, .print-sheet * {
            visibility: visible;
          }
          .print-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            min-height: auto !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          input {
            border: none !important;
            outline: none !important;
          }
        }
      ` }} />
      
      {/* Header Toolbar */}
      <div style={{ height: "54px", background: "rgba(10,8,7,0.95)", borderBottom: "1px solid rgba(212,165,116,0.12)", display: "flex", alignItems: "center", padding: "0 20px", justifyContent: "space-between", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button onClick={() => setShowLeaveModal(true)} className="tool-btn danger" style={{ padding: "6px 14px", fontSize: "11px" }}>Exit</button>
          <div style={{ width: "1px", height: "18px", background: "rgba(212,165,116,0.15)" }} />
          <span style={{ fontFamily: "Syne", fontSize: "16px", fontWeight: 800 }}>DocumentStudio</span>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <input 
            type="text" 
            value={projectTitle} 
            onChange={e => setProjectTitle(e.target.value)} 
            style={{ background: "#0c0a09", border: "1px solid rgba(212,165,116,0.15)", borderRadius: "8px", color: "#fff", padding: "6px 12px", fontSize: "12px", outline: "none", width: "220px" }}
            placeholder="Document Title"
          />
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button onClick={exportAsHTML} className="tool-btn" style={{ border: "1px solid rgba(212,165,116,0.25)", color: "#fff", background: "rgba(255,255,255,0.02)", padding: "6px 14px", fontSize: "12px" }}>
            Export HTML
          </button>
          <button onClick={triggerPrint} className="tool-btn" style={{ border: "1px solid rgba(212,165,116,0.25)", color: "#fff", background: "rgba(255,255,255,0.02)", padding: "6px 14px", fontSize: "12px" }}>
            Print / PDF
          </button>
          <button onClick={handleSaveAndExit} className="tool-btn primary" style={{ background: "linear-gradient(135deg,#deb887,#8b5a2b)", border: "none", color: "#fff", padding: "6px 16px", fontSize: "12px" }}>
            Save Document
          </button>
        </div>
      </div>

      {/* Main Studio Body */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        
        {/* Left Sidebar: Block Inserter */}
        <div style={{ width: "300px", minWidth: "300px", borderRight: "1px solid rgba(212,165,116,0.12)", background: "rgba(10,8,7,0.5)", display: "flex", flexDirection: "column", padding: "20px", gap: "20px" }}>
          
          <div>
            <span style={{ fontSize: "10px", color: "#deb887", fontWeight: 700, letterSpacing: "0.06em", display: "block", marginBottom: "8px" }}>INSERT BLOCKS</span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <button onClick={() => addBlock("h1")} className="tool-btn" style={{ padding: "6px", fontSize: "11px", justifyContent: "center" }}>H1 Title</button>
              <button onClick={() => addBlock("h2")} className="tool-btn" style={{ padding: "6px", fontSize: "11px", justifyContent: "center" }}>H2 Subtitle</button>
              <button onClick={() => addBlock("p")} className="tool-btn" style={{ padding: "6px", fontSize: "11px", justifyContent: "center" }}>Paragraph</button>
              <button onClick={() => addBlock("quote")} className="tool-btn" style={{ padding: "6px", fontSize: "11px", justifyContent: "center" }}>Quote Block</button>
              <button onClick={() => addBlock("table")} className="tool-btn" style={{ padding: "6px", fontSize: "11px", justifyContent: "center" }}>Data Table</button>
              <button onClick={() => addBlock("chart")} className="tool-btn" style={{ padding: "6px", fontSize: "11px", justifyContent: "center" }}>SVG Chart</button>
              <button onClick={() => addBlock("signature")} className="tool-btn" style={{ padding: "6px", fontSize: "11px", justifyContent: "center", gridColumn: "span 2" }}>+ Signature Pad</button>
            </div>
          </div>

          <div style={{ height: "1px", background: "rgba(212,165,116,0.08)" }} />

          {/* Active Block Inspector */}
          {activeBlock ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "10px", color: "#deb887", fontWeight: 700 }}>EDITING BLOCK ({activeBlock.type.toUpperCase()})</span>
                <button onClick={() => deleteBlock(activeBlock.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "11px" }}>✕ Delete</button>
              </div>

              {/* Text content block editor */}
              {(activeBlock.type === "h1" || activeBlock.type === "h2" || activeBlock.type === "p" || activeBlock.type === "quote") && (
                <div>
                  <label style={{ fontSize: "10px", color: "#5c5650", display: "block", marginBottom: "4px" }}>Block Text</label>
                  <textarea
                    value={activeBlock.content}
                    onChange={e => updateBlockContent(activeBlock.id, e.target.value)}
                    style={{ width: "100%", height: "120px", background: "#0c0a09", border: "1px solid rgba(212,165,116,0.15)", borderRadius: "8px", color: "#fff", padding: "8px 12px", fontSize: "11.5px", resize: "none", outline: "none" }}
                  />
                </div>
              )}

              {/* Table controls */}
              {activeBlock.type === "table" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <button onClick={() => addTableRow(activeBlock.id)} className="tool-btn" style={{ fontSize: "11px", justifyContent: "center", padding: "6px" }}>+ Add Data Row</button>
                  <span style={{ fontSize: "9px", color: "#666" }}>Data in column 2 (index 1) drives the visual chart rendering automatically.</span>
                </div>
              )}

              {/* Chart type controls */}
              {activeBlock.type === "chart" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div>
                    <label style={{ fontSize: "10px", color: "#5c5650", display: "block", marginBottom: "4px" }}>Chart Title</label>
                    <input
                      type="text"
                      value={activeBlock.title || ""}
                      onChange={e => setDocBlocks(prev => prev.map(b => b.id === activeBlock.id ? { ...b, title: e.target.value } : b))}
                      style={{ width: "100%", background: "#0c0a09", border: "1px solid rgba(212,165,116,0.15)", borderRadius: "6px", color: "#fff", padding: "6px", fontSize: "11px" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "10px", color: "#5c5650", display: "block", marginBottom: "4px" }}>Chart Type</label>
                    <select
                      value={activeBlock.chartType || "bar"}
                      onChange={e => setDocBlocks(prev => prev.map(b => b.id === activeBlock.id ? { ...b, chartType: e.target.value } : b))}
                      style={{ width: "100%", background: "#0c0a09", color: "#fff", border: "1px solid rgba(212,165,116,0.15)", borderRadius: "6px", fontSize: "11px", padding: "6px" }}
                    >
                      <option value="bar">SVG Bar Chart</option>
                      <option value="line">SVG Line Graph</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Signature properties */}
              {activeBlock.type === "signature" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div>
                    <label style={{ fontSize: "10px", color: "#5c5650", display: "block", marginBottom: "4px" }}>Signee Name</label>
                    <input
                      type="text"
                      value={activeBlock.name}
                      onChange={e => setDocBlocks(prev => prev.map(b => b.id === activeBlock.id ? { ...b, name: e.target.value } : b))}
                      style={{ width: "100%", background: "#0c0a09", border: "1px solid rgba(212,165,116,0.15)", borderRadius: "6px", color: "#fff", padding: "6px", fontSize: "11px" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "10px", color: "#5c5650", display: "block", marginBottom: "4px" }}>Official Role</label>
                    <input
                      type="text"
                      value={activeBlock.role}
                      onChange={e => setDocBlocks(prev => prev.map(b => b.id === activeBlock.id ? { ...b, role: e.target.value } : b))}
                      style={{ width: "100%", background: "#0c0a09", border: "1px solid rgba(212,165,116,0.15)", borderRadius: "6px", color: "#fff", padding: "6px", fontSize: "11px" }}
                    />
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div style={{ color: "#5c5650", fontSize: "11px", textAlign: "center" }}>
              Select any document block to customize it.
            </div>
          )}

        </div>

        {/* Center: A4 styled Workbench sheet */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#080604", overflowY: "auto", padding: "40px 20px", alignItems: "center" }}>
          
          {/* Paper sheet */}
          <div className="print-sheet" style={{ width: "100%", maxWidth: "600px", minHeight: "842px", background: "#ffffff", color: "#1a202c", padding: "50px", borderRadius: "12px", boxShadow: "0 10px 40px rgba(0,0,0,0.7)", display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {docBlocks.map(block => {
              const isSelected = block.id === activeBlockId;
              
              return (
                <div
                  key={block.id}
                  onClick={() => setActiveBlockId(block.id)}
                  style={{
                    position: "relative",
                    borderRadius: "6px",
                    outline: isSelected ? "1.5px dashed #6366f1" : "none",
                    cursor: "pointer",
                    padding: "4px 8px",
                    transition: "outline 0.2s"
                  }}
                >
                  
                  {/* Title block */}
                  {block.type === "h1" && (
                    <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: "28px", fontWeight: 800, margin: 0, color: "#111", letterSpacing: "-0.02em" }}>
                      {block.content}
                    </h1>
                  )}

                  {/* Subtitle block */}
                  {block.type === "h2" && (
                    <h2 style={{ fontSize: "18px", fontWeight: 600, margin: 0, color: "#2d3748", borderBottom: "1px solid #e2e8f0", paddingBottom: "6px" }}>
                      {block.content}
                    </h2>
                  )}

                  {/* Paragraph block */}
                  {block.type === "p" && (
                    <p style={{ fontSize: "13.5px", lineHeight: 1.6, color: "#4a5568", margin: 0 }}>
                      {block.content}
                    </p>
                  )}

                  {/* Quote block */}
                  {block.type === "quote" && (
                    <div style={{ borderLeft: "4px solid #6366f1", paddingLeft: "14px", fontStyle: "italic", fontSize: "13px", color: "#4a5568", background: "#f7fafc", padding: "10px 14px", borderRadius: "0 6px 6px 0" }}>
                      {block.content}
                    </div>
                  )}

                  {/* Interactive Table block */}
                  {block.type === "table" && (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
                        <thead>
                          <tr style={{ background: "#edf2f7", borderBottom: "2px solid #cbd5e0" }}>
                            {block.headers.map((h, i) => (
                              <th key={i} style={{ padding: "8px 10px", fontWeight: 600, color: "#2d3748" }}>{h}</th>
                            ))}
                            {isSelected && <th style={{ width: "30px" }} />}
                          </tr>
                        </thead>
                        <tbody>
                          {block.rows.map((row, rowIdx) => (
                            <tr key={rowIdx} style={{ borderBottom: "1px solid #e2e8f0" }}>
                              {row.map((cell, colIdx) => (
                                <td key={colIdx} style={{ padding: "6px 8px" }}>
                                  <input
                                    type="text"
                                    value={cell}
                                    onChange={e => updateTableCell(block.id, rowIdx, colIdx, e.target.value)}
                                    style={{ width: "100%", border: "none", background: "none", fontSize: "12px", outline: "none", padding: "2px" }}
                                  />
                                </td>
                              ))}
                              {isSelected && (
                                <td style={{ textAlign: "center" }}>
                                  <button onClick={(e) => { e.stopPropagation(); deleteTableRow(block.id, rowIdx); }} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "11px" }}>✕</button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* SVG Chart Block */}
                  {block.type === "chart" && renderSVGChart(block)}

                  {/* Signature block */}
                  {block.type === "signature" && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", marginTop: "16px" }}>
                      <div style={{ width: "160px", borderBottom: "1px solid #1a202c", paddingBottom: "4px", textAlign: "center" }}>
                        {/* Script font style preview */}
                        <span style={{ fontFamily: "cursive", fontSize: "16px", color: "#6366f1" }}>{block.name}</span>
                      </div>
                      <span style={{ fontSize: "10px", color: "#718096", marginTop: "4px", fontWeight: 500 }}>{block.role}</span>
                    </div>
                  )}

                </div>
              );
            })}

          </div>
        </div>
      </div>

      {/* Exit confirmation modal */}
      {showLeaveModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, backdropFilter: "blur(12px)" }}>
          <div className="glass-panel" style={{ width: "420px", padding: "30px", borderRadius: "24px", textAlign: "center", border: "1px solid rgba(212,165,116,0.25)", background: "#131110" }}>
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>📄</div>
            <h3 style={{ fontFamily: "Syne,sans-serif", fontSize: "22px", fontWeight: 800, color: "#fff", marginBottom: "10px" }}>Save interactive report?</h3>
            <p style={{ fontSize: "13px", color: "#8c8780", lineHeight: 1.6, marginBottom: "24px" }}>
              Would you like to save this formatted report to your past works database, or discard your current session edits?
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button className="tool-btn primary" onClick={handleSaveAndExit} style={{ justifyContent: "center", padding: "12px", fontSize: "13px" }}>
                Save & Exit to Dashboard
              </button>
              <div style={{ display: "flex", gap: "10px" }}>
                <button className="tool-btn danger" onClick={handleDiscardAndExit} style={{ flex: 1, justifyContent: "center", padding: "10px", fontSize: "12px" }}>
                  Discard Edits
                </button>
                <button className="tool-btn" onClick={() => setShowLeaveModal(false)} style={{ flex: 1, justifyContent: "center", padding: "10px", fontSize: "12px" }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
