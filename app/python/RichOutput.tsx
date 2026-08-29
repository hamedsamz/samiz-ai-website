import Image from "next/image";

export type TextOutput = {
  id: number;
  type: "text";
  stream: "stdout" | "stderr" | "result";
  message: string;
};

export type TableOutput = {
  id: number;
  type: "table";
  title?: string;
  columns: string[];
  rows: string[][];
  truncated?: boolean;
};

export type ImageOutput = {
  id: number;
  type: "image";
  title?: string;
  data: string;
  width: number;
  height: number;
};

export type OutputItem = TextOutput | TableOutput | ImageOutput;

export default function RichOutput({ item }: { item: OutputItem }) {
  if (item.type === "text") {
    return <pre className={item.stream}>{item.message}</pre>;
  }

  if (item.type === "table") {
    return (
      <figure className="python-rich-table" dir="rtl">
        {item.title ? <figcaption>{item.title}</figcaption> : null}
        <div className="python-table-scroll">
          <table>
            <thead>
              <tr>{item.columns.map((column, index) => <th key={`${column}-${index}`}>{column}</th>)}</tr>
            </thead>
            <tbody>
              {item.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {item.truncated ? <small>فقط ۱۰۰ ردیف اول نمایش داده شده است.</small> : null}
      </figure>
    );
  }

  return (
    <figure className="python-rich-image">
      {item.title ? <figcaption>{item.title}</figcaption> : null}
      <Image
        src={item.data}
        alt={item.title ?? "خروجی تصویری کد پایتون"}
        width={item.width || 900}
        height={item.height || 520}
        unoptimized
      />
      <a href={item.data} download="python-output.png">دانلود تصویر</a>
    </figure>
  );
}
