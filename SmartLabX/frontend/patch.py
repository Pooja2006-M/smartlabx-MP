import json
import os
import re

filepath = r'c:\Users\POOJA .M\OneDrive\Desktop\MIniProject\SmartLabX\frontend\src\pages\DatabaseLab.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update initialStudents
with open('40_students.json', 'r', encoding='utf-8') as f:
    students_json = f.read()

new_students_str = 'const initialStudents = ' + students_json + ';'
content = re.sub(r'const initialStudents = \[.*?\];', new_students_str, content, flags=re.DOTALL)

# 2. Add showAiAnalysis state
if 'const [showAiAnalysis' not in content:
    content = content.replace('const [showCreateStudent, setShowCreateStudent] = useState(false);', 
        'const [showCreateStudent, setShowCreateStudent] = useState(false);\n  const [showAiAnalysis, setShowAiAnalysis] = useState(false);')

# 3. Import AIAnalysisModal
if 'AIAnalysisModal' not in content:
    content = content.replace('import { Link, useNavigate } from \'react-router-dom\';', 
        'import { Link, useNavigate } from \'react-router-dom\';\nimport AIAnalysisModal from \'../components/AIAnalysisModal\';')

# 4. Add the button to the dashboard
button_html = """
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => setShowAiAnalysis(true)}
                          className="w-full rounded-xl bg-purple-600 px-2.5 py-1.5 text-[11px] font-semibold text-white transition hover:bg-purple-700"
                        >
                          🧠 AI Performance Analysis (K-Means + RF)
                        </button>
                      </div>
"""

if 'AI Performance Analysis' not in content:
    content = content.replace('</button>\n                      </div>\n                    </div>\n                    {showCreateStudent', 
        '</button>\n                      </div>\n                    </div>\n' + button_html + '\n                    {showCreateStudent')

# 5. Add the modal render at the root of the component
if '<AIAnalysisModal' not in content:
    content = content.replace('return (\n    <div className="min-h-screen', 
        'return (\n    <>\n      {showAiAnalysis && <AIAnalysisModal students={students} onClose={() => setShowAiAnalysis(false)} />}\n      <div className="min-h-screen')
    
    content = content.replace('    </div>\n  );\n}', '    </div>\n    </>\n  );\n}')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print('Successfully patched DatabaseLab.jsx')
