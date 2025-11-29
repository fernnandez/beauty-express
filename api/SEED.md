# Seed do Banco de Dados

Este arquivo contém dados iniciais (seed) para popular o banco de dados com informações realistas.

## Como executar

```bash
cd api
npm run seed
```

## Dados que serão criados

### Colaboradores (5)
- **Maria Silva** - Cabeleireira (50% comissão)
- **Ana Paula Santos** - Cabeleireira (45% comissão)
- **Juliana Costa** - Manicure/Pedicure (50% comissão)
- **Fernanda Oliveira** - Manicure/Pedicure (40% comissão)
- **Patricia Lima** - Cabeleireira (50% comissão) - **Inativa**

### Serviços (12)
- Corte Feminino - R$ 45,00
- Corte Masculino - R$ 30,00
- Coloração Completa - R$ 180,00
- Mechas - R$ 250,00
- Escova Progressiva - R$ 350,00
- Manicure - R$ 25,00
- Pedicure - R$ 35,00
- Manicure + Pedicure - R$ 55,00
- Sobrancelha - R$ 20,00
- Penteado - R$ 80,00
- Tratamento Capilar - R$ 120,00
- Corte + Escova - R$ 65,00

### Agendamentos
- **Hoje**: 6 agendamentos (alguns com colaborador, alguns sem)
- **Ontem**: 4 agendamentos (3 concluídos, 1 cancelado)
- **Amanhã**: 4 agendamentos agendados
- **Próxima semana**: 30 agendamentos distribuídos pelos próximos 6 dias

### Associações
- **Maria Silva**: Corte Feminino, Coloração, Mechas, Penteado, Tratamento
- **Ana Paula Santos**: Corte Feminino, Corte Masculino, Mechas, Tratamento
- **Juliana Costa**: Manicure, Pedicure, Manicure+Pedicure, Sobrancelha
- **Fernanda Oliveira**: Manicure, Pedicure, Manicure+Pedicure, Sobrancelha

## Nota

⚠️ **Atenção**: O seed irá **limpar todos os dados existentes** antes de criar os novos dados. Use apenas em ambiente de desenvolvimento.

