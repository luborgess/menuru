import requests
from datetime import datetime
import json
from typing import Dict, List, Optional

class CardapioScraper:
    def __init__(self):
        self.base_url = "https://fump.ufmg.br:3003/cardapios"
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }

    def get_restaurantes(self) -> List[Dict]:
        """Obtém a lista de restaurantes disponíveis."""
        try:
            response = requests.get(f"{self.base_url}/restaurantes", headers=self.headers)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            print(f"Erro ao obter restaurantes: {e}")
            return []

    def get_cardapio(self, restaurante_id: int, data: str, tipo_refeicao: str) -> Optional[Dict]:
        """
        Obtém o cardápio para um restaurante específico em uma data.
        
        Args:
            restaurante_id: ID do restaurante
            data: Data no formato YYYY-MM-DD
            tipo_refeicao: "Almoço" ou "Jantar"
        """
        try:
            # A API espera a mesma data para início e fim
            params = {
                "id": restaurante_id,
                "dataInicio": data,
                "dataFim": data
            }
            
            response = requests.get(f"{self.base_url}/cardapio", params=params, headers=self.headers)
            response.raise_for_status()
            data = response.json()

            # Filtra pelo tipo de refeição
            if data.get("cardapios"):
                for cardapio in data["cardapios"]:
                    for refeicao in cardapio.get("refeicoes", []):
                        if refeicao["tipoRefeicao"] == tipo_refeicao:
                            return refeicao
            
            return None

        except requests.RequestException as e:
            print(f"Erro ao obter cardápio: {e}")
            return None

    def formatar_cardapio(self, cardapio: Dict) -> str:
        """Formata o cardápio para exibição."""
        if not cardapio:
            return "Cardápio não disponível"

        resultado = []
        resultado.append(f"\n=== {cardapio['tipoRefeicao']} ===\n")

        # Organiza os pratos por tipo
        pratos_por_tipo = {}
        for prato in cardapio.get("pratos", []):
            tipo = prato["tipoPrato"]
            if tipo not in pratos_por_tipo:
                pratos_por_tipo[tipo] = []
            pratos_por_tipo[tipo].append(prato["descricaoPrato"])

        # Ordem de exibição dos tipos de prato
        ordem_tipos = [
            "Entrada 1",
            "Entrada 2",
            "Acompanhamento 1",
            "Acompanhamento 2",
            "Acompanhamento 3",
            "Prato protéico 1",
            "Prato protéico 3",
            "Guarnição",
            "Sobremesa 1 (uma porção)",
            "(um copo)"
        ]

        # Exibe os pratos na ordem definida
        for tipo in ordem_tipos:
            if tipo in pratos_por_tipo:
                resultado.append(f"{tipo}:")
                for prato in pratos_por_tipo[tipo]:
                    resultado.append(f"  - {prato}")
                resultado.append("")

        return "\n".join(resultado)

def main():
    scraper = CardapioScraper()
    
    # Lista restaurantes disponíveis
    print("Obtendo lista de restaurantes...")
    restaurantes = scraper.get_restaurantes()
    
    if not restaurantes:
        print("Não foi possível obter a lista de restaurantes.")
        return

    print("\nRestaurantes disponíveis:")
    for r in restaurantes:
        print(f"{r['id']} - {r['nome']}")

    # Solicita inputs do usuário
    restaurante_id = int(input("\nDigite o ID do restaurante: "))
    data = input("Digite a data (YYYY-MM-DD): ")
    tipo_refeicao = input("Digite o tipo de refeição (Almoço/Jantar): ")

    # Obtém e exibe o cardápio
    cardapio = scraper.get_cardapio(restaurante_id, data, tipo_refeicao)
    print("\nCardápio:")
    print(scraper.formatar_cardapio(cardapio))

if __name__ == "__main__":
    main()
