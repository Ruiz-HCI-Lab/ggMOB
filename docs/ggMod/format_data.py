import pandas as pd 
import copy

test = ""
df = pd.read_csv('genus_genus_ipr_wCounts' + test + '.csv', header=None, names=['source', 'target', 'code', 'count'])
df_cargo = pd.read_csv('summary_genera_pair_IPR_cargo_count' + test + '.csv', header=None, names=['code', 'source', 'target', 'count'])
df_amr = pd.read_csv('AMR_cargo_data_by_name' + test + '.tsv',delimiter='\t', index_col=None, header=None, names=['code', 'uid', 'source', 'target', 'name'])


codes = df['code'].unique()

temp = {"source": "", "target": "", "pair": ""}
for i in range(0, len(codes)):
  code = codes[i]
  temp[code] = copy.deepcopy({'ice': 0, 'cargo': 0, 'amr': 0, 'amr_names': set()})

data = {}

for index,row in df.iterrows():
  source = row['source']
  target = row['target']
  code = str(row['code'])
  count = int(row['count'])
  pair = "[\'" +source + "\', \'" +target + "\']"

  if pair not in data:
    data[pair] = copy.deepcopy(temp)
    data[pair]["source"] = source
    data[pair]["target"] = target
    data[pair]["pair"] = pair

  data[pair][code]['ice'] = data[pair][code]['ice'] + count

for index,row in df_cargo.iterrows():
  source = row['source']
  target = row['target']
  code = str(row['code'])
  count = int(row['count'])
  pair = "[\'" +source + "\', \'" +target + "\']"

  if pair in data:
    if code in data[pair]:
      data[pair][code]['cargo'] = data[pair][code]['cargo'] + count

for index,row in df_amr.iterrows():
  source = row['source']
  target = row['target']
  code = str(row['code'])
  name = str(row['name'])
  pair = "[\'" +source + "\', \'" +target + "\']"

  if (pair not in data):
    pair = "[\'" +target + "\', \'" +source + "\']"

  if pair in data:
    if code in data[pair]:
      data[pair][code]['amr'] = data[pair][code]['amr'] + 1
      data[pair][code]['amr_names'].add(name)



links = []

for key in data:
  value = data[key]
  for i in range(0, len(codes)):
    code = codes[i]
    value[code]['amr_names'] = list(value[code]['amr_names'])
  links.append(value)

print (links)
