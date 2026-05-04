from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.charts.barcharts import VerticalBarChart

def test():
    doc = SimpleDocTemplate("test_chart.pdf", pagesize=letter)
    elements = []
    
    d = Drawing(400, 200)
    chart = VerticalBarChart()
    chart.x = 50
    chart.y = 50
    chart.height = 125
    chart.width = 300
    chart.data = [[100, 200, 150]]
    chart.categoryAxis.categoryNames = ['User A', 'User B', 'User C']
    d.add(chart)
    
    elements.append(d)
    doc.build(elements)
    print("PDF generated successfully")

if __name__ == "__main__":
    test()
