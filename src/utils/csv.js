export const downloadSampleCSV = () => {
  const headers = "Name,Phone,Class,Batch,Monthly Fee,Status\n";
  const sampleData = "John Doe,9876543210,10th,Morning,1500,Active\nJane Smith,9123456780,12th,Evening,2000,Active";
  const blob = new Blob([headers + sampleData], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "students_template.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
