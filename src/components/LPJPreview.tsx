import React from "react";
import DocumentPreviewRenderer from "./DocumentPreviewRenderer";
import { KeuanganTransaction } from "../types";

interface LPJPreviewProps {
  proposalMarkdown: string;
  paperTheme: "classic" | "creamy" | "minimal" | "green-gold";
  fontStyle: "poppins" | "arial" | "mono";
  namaKegiatan: string;
  namaRW: string;
  namaKetua: string;
  namaSekretaris: string;
  namaBendahara: string;
  namaRWKetua: string;
  eventLogo: string;
  showStamp: boolean;
  keuangan: KeuanganTransaction[];
  natura?: any[];
  useMockData: boolean;
}

export default function LPJPreview(props: LPJPreviewProps) {
  return (
    <DocumentPreviewRenderer
        proposalMarkdown={props.proposalMarkdown}
        paperTheme={props.paperTheme}
        fontStyle={props.fontStyle}
        namaKegiatan={props.namaKegiatan}
        namaRW={props.namaRW}
        namaKetua={props.namaKetua}
        namaSekretaris={props.namaSekretaris}
        namaBendahara={props.namaBendahara}
        namaRWKetua={props.namaRWKetua}
        eventLogo={props.eventLogo}
        showStamp={props.showStamp}
        useMockData={props.useMockData}
    >
      <div></div>
    </DocumentPreviewRenderer>
  );
}
