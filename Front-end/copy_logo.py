import shutil
src = '/Users/mohd2002monish/.gemini/antigravity-ide/brain/6ac3376f-780e-4afc-b931-074cacd9be17/recocareer_logo_1781895739586.png'
dest1 = '/Users/mohd2002monish/Desktop/Job-apply-app/Front-end/public/logo.png'
dest2 = '/Users/mohd2002monish/Desktop/Job-apply-app/Front-end/public/favicon.ico'
shutil.copyfile(src, dest1)
shutil.copyfile(src, dest2)
print("Copied successfully!")
