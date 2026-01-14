// src/data/questions.ts

export interface Question {
  id: number;
  text: string;
  answers: string[];
  correctAnswerIndex: number;
}

export const questions: Question[] = [
  {
    id: 1,
    text: "Którego polecenia należy użyć, aby wyraz TEKST został wyświetlony w kolorze czarnym (składnia HTML/Deprecated)?",
    answers: [
      "<body color=\"black\"> TEKST </font>",
      "<font color=\"czarny\"> TEKST </font>",
      "<font color=\"#000000\"> TEKST </font>",
      "<body bgcolor=\"black\"> TEKST </body>"
    ],
    correctAnswerIndex: 2
  },
  {
    id: 2,
    text: "Jakiego znacznika należy użyć, aby przejść do kolejnej linii tekstu, nie tworząc akapitu na stronie internetowej?",
    answers: ["<p>", "</b>", "<br>", "</br>"],
    correctAnswerIndex: 2
  },
  {
    id: 3,
    text: "Kaskadowe arkusze stylów (CSS) tworzy się w celu:",
    answers: [
      "ułatwienia formatowania strony",
      "nadpisywania wartości znaczników już ustawionych na stronie",
      "połączenia struktury dokumentu strony z właściwą formą jego prezentacji",
      "blokowania jakichkolwiek zmian w wartościach znaczników"
    ],
    correctAnswerIndex: 2
  },
  {
    id: 4,
    text: "W podanej regule CSS: h1 {color: blue} h1 oznacza:",
    answers: ["klasę", "wartość", "selektor", "deklarację"],
    correctAnswerIndex: 2
  },
  {
    id: 5,
    text: "Jakiego formatu należy użyć do zapisu obrazu z kompresją stratną?",
    answers: ["GIF", "PNG", "PCX", "JPEG"],
    correctAnswerIndex: 3
  },
  {
    id: 6,
    text: "Jak nazywa się proces przedstawienia informacji zawartej w dokumencie elektronicznym we właściwej formie (np. wyświetlenie strony WWW)?",
    answers: ["Mapowanie", "Rasteryzacja", "Renderowanie", "Teksturowanie"],
    correctAnswerIndex: 2
  },
  {
    id: 7,
    text: "Jak nazywa się podzbiór języka SQL związany z formułowaniem zapytań (SELECT)?",
    answers: ["SQL DML", "SQL DDL", "SQL DCL", "SQL DQL"],
    correctAnswerIndex: 3
  },
  {
    id: 8,
    text: "Typowe polecenia SQL DML (Data Manipulation Language) to:",
    answers: [
      "SELECT, SELECT INTO",
      "ALTER, CREATE, DROP",
      "DENY, GRANT, REVOKE",
      "DELETE, INSERT, UPDATE"
    ],
    correctAnswerIndex: 3
  },
  {
    id: 9,
    text: "Jak nazywa się element bazy danych, za pomocą którego można jedynie odczytać dane z bazy, prezentując je w postaci sformatowanej (np. do druku)?",
    answers: ["Tabela", "Raport", "Zapytanie", "Formularz"],
    correctAnswerIndex: 1
  },
  {
    id: 10,
    text: "Co należy zastosować w organizacji danych, aby zapytania w bazie danych były wykonywane szybciej (optymalizacja wyszukiwania)?",
    answers: ["Reguły", "Indeksy", "Wartości domyślne", "Klucze podstawowe"],
    correctAnswerIndex: 1
  },
  {
    id: 11,
    text: "W języku JavaScript typ zmiennej:",
    answers: [
      "nie występuje",
      "jest tylko jeden",
      "następuje poprzez przypisanie wartości (dynamiczne typowanie)",
      "musi być zadeklarowany na początku skryptu"
    ],
    correctAnswerIndex: 2
  },
  {
    id: 12,
    text: "Jaki program przekształca kod źródłowy na język komputera, tworząc plik wynikowy?",
    answers: ["Debugger", "Kompilator", "Edytor kodu", "Środowisko programistyczne"],
    correctAnswerIndex: 1
  },
  {
    id: 13,
    text: "Jak nazywa się program, który wykonuje instrukcje kodu źródłowego na bieżąco, bez generowania pliku wynikowego?",
    answers: ["Interpreter", "Kompilator", "Konwerter kodu", "Konwerter języka"],
    correctAnswerIndex: 0
  },
  {
    id: 14,
    text: "Który język skryptowy jest wykonywany po stronie serwera?",
    answers: ["C#", "Perl", "PHP", "JavaScript (klasycznie)"],
    correctAnswerIndex: 2
  },
  {
    id: 15,
    text: "Co to jest DBMS?",
    answers: [
      "Strukturalny język zapytań",
      "System zarządzania bazą danych",
      "Obiektowy język programowania",
      "Arkusz stylów"
    ],
    correctAnswerIndex: 1
  },
  {
    id: 16,
    text: "Który z odsyłaczy posiada poprawną konstrukcję HTML?",
    answers: [
      "<a href='mailto:adres'> tekst </a>",
      "<a href='http://adres'> tekst </a>",
      "<a href=\"http://adres\"> tekst <a>",
      "<a href=\"mailto:adres\"> tekst </a>"
    ],
    correctAnswerIndex: 1
  },
  {
    id: 17,
    text: "W znaczniku <head> NIE umieszcza się informacji dotyczącej:",
    answers: ["autora", "kodowania znaków", "typu dokumentu (!DOCTYPE)", "automatycznego odświeżania"],
    correctAnswerIndex: 2
  },
  {
    id: 18,
    text: "Który z formatów NIE pozwala na zapis plików animowanych?",
    answers: ["GIF", "SWF", "SVG", "JPEG"],
    correctAnswerIndex: 3
  },
  {
    id: 19,
    text: "Który z formatów graficznych pozwala na zapis przejrzystego tła (przezroczystości)?",
    answers: ["GIF", "RAW", "BMP", "JPEG"],
    correctAnswerIndex: 0
  },
  {
    id: 20,
    text: "Które oprogramowanie NIE JEST systemem zarządzania treścią (CMS)?",
    answers: ["Joomla", "Apache", "Mambo", "WordPress"],
    correctAnswerIndex: 1
  },
  {
    id: 21,
    text: "Który format zapewnia największą redukcję rozmiaru pliku dźwiękowego (kompresja stratna)?",
    answers: ["WAV", "PCM", "MP3", "CD-Audio"],
    correctAnswerIndex: 2
  },
  {
    id: 22,
    text: "Którego ze słów kluczowych języka SQL należy użyć, aby wyeliminować duplikaty w wynikach?",
    answers: ["LIKE", "DISTINCT", "ORDER BY", "GROUP BY"],
    correctAnswerIndex: 1
  },
  {
    id: 23,
    text: "Polecenie REVOKE SELECT ON nazwa1 FROM nazwa2 w języku SQL umożliwia:",
    answers: [
      "nadanie uprawnień",
      "odbieranie uprawnień użytkownikowi",
      "usuwanie użytkownika",
      "nadawanie praw do tabeli"
    ],
    correctAnswerIndex: 1
  },
  {
    id: 24,
    text: "Który typ pola w SQL jest stało-znakowy (zawsze zajmuje tyle samo miejsca)?",
    answers: ["char", "text", "time", "varchar"],
    correctAnswerIndex: 0
  },
  {
    id: 25,
    text: "Operator arytmetyczny modulo (reszta z dzielenia) w języku SQL/PHP to:",
    answers: ["/", "||", "&", "%"],
    correctAnswerIndex: 3
  },
  {
    id: 26,
    text: "Aby policzyć wszystkie wiersze tabeli 'Koty' należy użyć polecenia:",
    answers: [
      "SELECT COUNT(*) FROM Koty",
      "SELECT ROWNUM() FROM Koty",
      "SELECT COUNT(Koty) AS ROWNUM",
      "SELECT COUNT(ROWNUM) FROM Koty"
    ],
    correctAnswerIndex: 0
  },
  {
    id: 27,
    text: "Integralność referencyjna w modelu relacyjnym oznacza, że:",
    answers: [
      "Klucz główny nie jest pusty",
      "Klucz obcy nie zawiera NULL",
      "Każdemu kluczowi głównemu odpowiada jeden klucz obcy",
      "Wartość klucza obcego musi istnieć jako klucz główny w powiązanej tabeli (lub być NULL)"
    ],
    correctAnswerIndex: 3
  },
  {
    id: 28,
    text: "Deklaracja 'var x=true;' w JavaScript tworzy zmienną typu:",
    answers: ["logicznego", "liczbowego", "ciąg znaków", "wyliczeniowego"],
    correctAnswerIndex: 0
  },
  {
    id: 29,
    text: "Odwoływanie się funkcji do samej siebie to:",
    answers: ["iteracja", "rekurencja", "hermetyzacja", "dziedziczenie"],
    correctAnswerIndex: 1
  },
  {
    id: 30,
    text: "Konstruktor w języku PHP (OOP) jest metodą o nazwie:",
    answers: ["_new", "_open", "_create", "__construct"],
    correctAnswerIndex: 3
  },
  {
    id: 31,
    text: "W języku CSS właściwość 'height' służy do określenia:",
    answers: ["szerokości", "marginesu", "wysokości", "obramowania"],
    correctAnswerIndex: 2
  },
  {
    id: 32,
    text: "Za pomocą którego protokołu należy wysłać pliki na serwer WWW?",
    answers: ["DHCP", "FTP", "POP3", "DNS"],
    correctAnswerIndex: 1
  },
  {
    id: 33,
    text: "Który z wymienionych formatów plików graficznych obsługuje przezroczystość i jest bezstratny?",
    answers: ["JPG", "PNG", "NEF", "BMP"],
    correctAnswerIndex: 1
  },
  {
    id: 34,
    text: "Który zapis stylu CSS ustawi tło bloku na kolor niebieski?",
    answers: [
      "div {shadow: blue;}",
      "div {border-color: blue;}",
      "div {color: blue;}",
      "div {background-color: blue;}"
    ],
    correctAnswerIndex: 3
  },
  {
    id: 35,
    text: "Domyślna nazwa pliku konfiguracyjnego serwera Apache to:",
    answers: [".configuration", "configuration.php", "htaccess.cnf", ".htaccess"],
    correctAnswerIndex: 3
  },
  {
    id: 36,
    text: "Organizacja zajmująca się ustalaniem standardu dla języka HTML to:",
    answers: ["W3C", "ISO", "NASK", "WYSIWYG"],
    correctAnswerIndex: 0
  },
  {
    id: 37,
    text: "Aby stworzyć tabelę w bazie danych, należy zastosować polecenie SQL:",
    answers: ["ADD TABLE", "NEW TABLE", "PLUS TABLE", "CREATE TABLE"],
    correctAnswerIndex: 3
  },
  {
    id: 38,
    text: "Zdarzenie JavaScript, będące reakcją na pojedyncze kliknięcie, nosi nazwę:",
    answers: ["onClick", "onDblClick", "onLoad", "onKeyDown"],
    correctAnswerIndex: 0
  },
  {
    id: 39,
    text: "W języku CSS kolor zapisany jako #FF0000 to:",
    answers: ["Czarny", "Niebieski", "Czerwony", "Biały"],
    correctAnswerIndex: 2
  },
  {
    id: 40,
    text: "Instrukcja UPDATE w SQL służy do:",
    answers: [
      "Dodawania nowych rekordów",
      "Aktualizacji istniejących danych",
      "Usuwania tabeli",
      "Tworzenia bazy danych"
    ],
    correctAnswerIndex: 1
  },
  {
    id: 41,
    text: "Certyfikat SSL jest stosowany do:",
    answers: [
      "Zapisywania sesji",
      "Identyfikacji właściciela i szyfrowania transmisji",
      "Blokowania wirusów",
      "Kompresji danych"
    ],
    correctAnswerIndex: 1
  },
  {
    id: 42,
    text: "W języku HTML atrybut 'alt' znacznika <img> służy do:",
    answers: [
      "Podania ścieżki pliku",
      "Wyświetlenia tekstu alternatywnego (gdy obrazek się nie wczyta)",
      "Podpisu pod obrazkiem",
      "Ustawienia obramowania"
    ],
    correctAnswerIndex: 1
  },
  {
    id: 43,
    text: "Do edycji grafiki wektorowej stosuje się program:",
    answers: ["Paint", "Audacity", "Wordpad", "Corel Draw / Inkscape"],
    correctAnswerIndex: 3
  },
  {
    id: 44,
    text: "Aby zdefiniować w języku HTML listę nienumerowaną (punktowaną), używamy znacznika:",
    answers: ["<dd>", "<dt>", "<ol>", "<ul>"],
    correctAnswerIndex: 3
  },
  {
    id: 45,
    text: "Prawidłowy zapis samozamykającego się znacznika nowej linii w XHTML to:",
    answers: ["</ br>", "<br />", "</br/>", "<br> </br>"],
    correctAnswerIndex: 1
  },
  {
    id: 46,
    text: "Aby przenieść witrynę na serwer (upload), używamy klienta:",
    answers: ["Bugzilla", "Go!Zilla", "FileZilla", "CloneZilla"],
    correctAnswerIndex: 2
  },
  {
    id: 47,
    text: "Instrukcja DROP TABLE w SQL ma za zadanie:",
    answers: [
      "Usunąć całą tabelę z bazy",
      "Usunąć tylko dane z tabeli",
      "Zmienić nazwę tabeli",
      "Dodać kolumnę"
    ],
    correctAnswerIndex: 0
  },
  {
    id: 48,
    text: "Wartość pola pełniącego rolę klucza podstawowego (Primary Key):",
    answers: [
      "Musi być unikalna i nie-NULL",
      "Może się powtarzać",
      "Służy do szyfrowania",
      "Może być pusta"
    ],
    correctAnswerIndex: 0
  },
  {
    id: 49,
    text: "Aby uprościć wprowadzanie i edytowanie danych w bazie Access/SQL dla użytkownika końcowego, tworzy się:",
    answers: ["Kwerendę", "Formularz", "Raport", "Filtr"],
    correctAnswerIndex: 1
  },
  {
    id: 50,
    text: "Aby naprawić uszkodzoną tabelę w MySQL, należy użyć polecenia:",
    answers: ["FIX TABLE", "CHECK TABLE", "REPAIR TABLE", "RESOLVE TABLE"],
    correctAnswerIndex: 2
  }
];