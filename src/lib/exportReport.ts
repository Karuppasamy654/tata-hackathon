// PDF Report Export
import jsPDF from 'jspdf';
import { DriverProfile, HistoryEntry } from './driverProfile';

export async function exportReport(
  profile: DriverProfile,
  history: HistoryEntry[]
) {
  const pdf = new jsPDF('landscape', 'mm', 'a4');
  const width = pdf.internal.pageSize.getWidth();
  const height = pdf.internal.pageSize.getHeight();

  // Background
  pdf.setFillColor(10, 12, 20);
  pdf.rect(0, 0, width, height, 'F');

  // Header
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(28);
  pdf.setTextColor(0, 212, 255);
  pdf.text('Near-Miss Accident Predictor', 20, 25);

  pdf.setFontSize(12);
  pdf.setTextColor(150, 160, 180);
  pdf.text(`Report Generated: ${new Date().toLocaleString()}`, 20, 35);

  // Divider line
  pdf.setDrawColor(0, 212, 255);
  pdf.setLineWidth(0.5);
  pdf.line(20, 40, width - 20, 40);

  // Driver Score Section
  pdf.setFontSize(18);
  pdf.setTextColor(255, 255, 255);
  pdf.text('Driver Safety Summary', 20, 55);

  const scoreColor = profile.overallScore >= 70 ? [0, 255, 136] : profile.overallScore >= 40 ? [255, 214, 0] : [255, 51, 102];
  pdf.setFontSize(48);
  pdf.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  pdf.text(`${profile.overallScore}`, 30, 85);

  pdf.setFontSize(14);
  pdf.setTextColor(150, 160, 180);
  pdf.text('/100', 65, 85);
  pdf.text('Overall Safety Score', 30, 95);

  // Stats Table
  const stats = [
    ['Safe Driving', `${profile.safePercentage}%`],
    ['Risky Driving', `${profile.riskyPercentage}%`],
    ['Average Speed', `${profile.avgSpeed} km/h`],
    ['Max Risk Score', `${profile.maxRiskScore}`],
    ['Total Alerts', `${profile.totalAlerts}`],
    ['Trend', profile.trend.charAt(0).toUpperCase() + profile.trend.slice(1)],
  ];

  let yPos = 55;
  pdf.setFontSize(12);
  stats.forEach(([label, value]) => {
    pdf.setTextColor(150, 160, 180);
    pdf.text(label, 130, yPos);
    pdf.setTextColor(255, 255, 255);
    pdf.text(value, 220, yPos);
    yPos += 10;
  });

  // Risk History Section
  pdf.setFontSize(18);
  pdf.setTextColor(255, 255, 255);
  pdf.text('Risk Score History', 20, 125);

  if (history.length > 0) {
    const chartX = 20;
    const chartY = 135;
    const chartW = width - 40;
    const chartH = 50;

    // Chart background
    pdf.setFillColor(15, 18, 30);
    pdf.roundedRect(chartX, chartY, chartW, chartH, 3, 3, 'F');

    // Grid lines
    pdf.setDrawColor(30, 35, 50);
    pdf.setLineWidth(0.2);
    for (let i = 0; i <= 4; i++) {
      const y = chartY + (chartH / 4) * i;
      pdf.line(chartX, y, chartX + chartW, y);
    }

    // Plot risk scores
    const dataPoints = history.slice(-60);
    const step = chartW / Math.max(dataPoints.length - 1, 1);

    for (let i = 1; i < dataPoints.length; i++) {
      const x1 = chartX + step * (i - 1);
      const x2 = chartX + step * i;
      const y1 = chartY + chartH - (dataPoints[i - 1].riskScore / 100) * chartH;
      const y2 = chartY + chartH - (dataPoints[i].riskScore / 100) * chartH;

      const score = dataPoints[i].riskScore;
      if (score >= 70) pdf.setDrawColor(255, 51, 102);
      else if (score >= 40) pdf.setDrawColor(255, 214, 0);
      else pdf.setDrawColor(0, 255, 136);

      pdf.setLineWidth(1);
      pdf.line(x1, y1, x2, y2);
    }
  }

  // Footer
  pdf.setFontSize(9);
  pdf.setTextColor(80, 90, 110);
  pdf.text('Near-Miss Accident Predictor — AI-Powered Driving Safety Analytics', 20, height - 10);
  pdf.text('Confidential Report', width - 55, height - 10);

  pdf.save(`driving-report-${new Date().toISOString().slice(0, 10)}.pdf`);
}
