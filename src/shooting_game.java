
import javax.swing.*;
import java.awt.*;
import java.awt.event.*;
import java.util.ArrayList;
import java.util.Random;

public class shooting_game extends JPanel implements ActionListener, KeyListener {

    int playerX = 280;
    int playerY = 500;
    int playerSize = 40;

    ArrayList<Rectangle> bullets = new ArrayList<>();
    ArrayList<Rectangle> enemies = new ArrayList<>();

    Random random = new Random();

    int score = 0;
    int life = 3;
    boolean gameOver = false;

    Timer timer = new Timer(20, this);

    public shooting_game() {
        setPreferredSize(new Dimension(600, 600));
        setBackground(Color.BLACK);

        addKeyListener(this);
        setFocusable(true);

        timer.start();
    }

    @Override
    protected void paintComponent(Graphics g) {
        super.paintComponent(g);

        g.setColor(Color.GREEN);
        g.fillRect(playerX, playerY, playerSize, playerSize);

        g.setColor(Color.YELLOW);
        for (Rectangle bullet : bullets) {
            g.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        }

        g.setColor(Color.RED);
        for (Rectangle enemy : enemies) {
            g.fillOval(enemy.x, enemy.y, enemy.width, enemy.height);
        }

        g.setColor(Color.WHITE);
        g.setFont(new Font("맑은 고딕", Font.BOLD, 20));
        g.drawString("점수 : " + score, 20, 30);

        g.drawString("점수 : " + score, 20, 30);
        g.drawString("생명 : " + life, 20, 55);
        g.drawString("시간 : " + timeLeft + "초", 20, 80);

        if (gameOver) {
            g.setColor(Color.WHITE);

            g.setFont(new Font("맑은 고딕", Font.BOLD, 40));
            g.drawString("GAME OVER", 170, 250);

            g.setFont(new Font("맑은 고딕", Font.BOLD, 30));
            g.drawString("최종 점수 : " + score, 185, 300);

            g.setFont(new Font("맑은 고딕", Font.BOLD, 20));
            g.drawString("R 키를 눌러 다시 시작", 190, 350);
        }
    }

    boolean left = false;
    boolean right = false;

    int timeLeft = 120;
    long lastTime = System.currentTimeMillis();

    @Override
    public void actionPerformed(ActionEvent e) {

        if (gameOver) {
            repaint();
            return;
        }

        long now = System.currentTimeMillis();

        if (now - lastTime >= 1000) {
            timeLeft--;
            lastTime = now;
        }

        if (timeLeft <= 0) {
            timeLeft = 0;
            gameOver = true;
        }

        if (left) {
            playerX -= 5;
        }

        if (right) {
            playerX += 5;
        }

        if (playerX < 0) {
            playerX = 0;
        }

        if (playerX > 560) {
            playerX = 560;
        }

        for (int i = bullets.size() - 1; i >= 0; i--) {
            Rectangle bullet = bullets.get(i);
            bullet.y -= 10;

            if (bullet.y < 0) {
                bullets.remove(i);
            }
        }

        if (random.nextInt(40) == 0) {
            int x = random.nextInt(560);
            enemies.add(new Rectangle(x, 0, 40, 40));
        }

        for (int i = enemies.size() - 1; i >= 0; i--) {
            Rectangle enemy = enemies.get(i);
            enemy.y += 2;

            if (enemy.y > 600) {
                enemies.remove(i);
                life--;

                if (life <= 0) {
                    gameOver = true;
                }
            }
        }

        for (int i = bullets.size() - 1; i >= 0; i--) {

            Rectangle bullet = bullets.get(i);

            for (int j = enemies.size() - 1; j >= 0; j--) {

                Rectangle enemy = enemies.get(j);

                if (bullet.intersects(enemy)) {
                    bullets.remove(i);
                    enemies.remove(j);

                    score++;
                    break;
                }
            }
        }

        repaint();
    }

    @Override
    public void keyPressed(KeyEvent e) {

        int key = e.getKeyCode();

        if (!gameOver) {

            if (key == KeyEvent.VK_LEFT) {
                left = true;
            }

            if (key == KeyEvent.VK_RIGHT) {
                right = true;
            }

            if (key == KeyEvent.VK_SPACE) {
                bullets.add(
                        new Rectangle(playerX + 17, playerY, 6, 15)
                );
            }

            if (playerX < 0) {
                playerX = 0;
            }

            if (playerX > 560) {
                playerX = 560;
            }
        }

        if (key == KeyEvent.VK_R && gameOver) {
            playerX = 280;
            bullets.clear();
            enemies.clear();

            score = 0;
            life = 3;
            timeLeft = 120;

            lastTime = System.currentTimeMillis();

            gameOver = false;
        }
    }

    @Override
    public void keyReleased(KeyEvent e) {

        if (e.getKeyCode() == KeyEvent.VK_LEFT) {
            left = false;
        }

        if (e.getKeyCode() == KeyEvent.VK_RIGHT) {
            right = false;
        }
    }

    @Override
    public void keyTyped(KeyEvent e) {}


    public static void main(String[] args) {

        JFrame frame = new JFrame("Java 슈팅게임");

        shooting_game game = new shooting_game();

        frame.add(game);
        frame.pack();

        frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        frame.setLocationRelativeTo(null);
        frame.setResizable(false);
        frame.setVisible(true);
    }
}
